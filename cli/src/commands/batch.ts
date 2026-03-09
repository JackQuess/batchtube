import { readFileSync, existsSync } from 'node:fs';
import { loadConfig } from '../config.js';
import { createBatch, BatchTubeApiError } from '../api.js';

type Format = 'mp4' | 'mp3';
type Quality = 'best' | '1080p' | '720p';
type ProcessingMode = 'none' | 'upscale_4k';

export interface BatchOptions {
  format?: Format;
  quality?: Quality;
  zip?: boolean;
  json?: boolean;
  apiBaseUrl?: string;
  processing?: ProcessingMode;
}

const URL_RE = /^https?:\/\/[^\s]+$/i;

function extractUrls(args: string[]): string[] {
  const urls: string[] = [];
  for (const arg of args) {
    const trimmed = arg.trim();
    if (!trimmed) continue;
    if (URL_RE.test(trimmed)) {
      urls.push(trimmed);
      continue;
    }
    if (existsSync(trimmed)) {
      const content = readFileSync(trimmed, 'utf-8');
      const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (URL_RE.test(line)) urls.push(line);
      }
      continue;
    }
    console.error(`Not a URL or file: ${trimmed}`);
    process.exit(1);
  }
  return urls;
}

export async function runBatch(fileOrUrls: string[], opts: BatchOptions): Promise<void> {
  const config = loadConfig(opts.apiBaseUrl);
  if (!config) {
    console.error('Run `batchtube login` first.');
    process.exit(1);
  }
  const base = (opts.apiBaseUrl ?? config.apiBaseUrl).replace(/\/+$/, '');

  const urls = extractUrls(fileOrUrls);
  if (urls.length === 0) {
    console.error('Usage: batchtube batch <file.txt> or batchtube batch <url1> <url2> ...');
    process.exit(1);
  }

  const format = (opts.format ?? 'mp4') as 'mp4' | 'mp3';
  const quality = (opts.quality ?? 'best') as 'best' | '1080p' | '720p';

  if (!opts.json) console.log(`Creating batch with ${urls.length} URL(s)...`);
  try {
    const batch = await createBatch(base, config.apiKey, {
      urls,
      options: {
        format: format === 'mp3' ? 'mp3' : 'mp4',
        quality,
        archive_as_zip: opts.zip ?? false,
        ...(opts.processing ? { processing: opts.processing } : {})
      },
      auto_start: true
    });
    if (opts.json) {
      console.log(JSON.stringify(batch, null, 2));
      return;
    }
    console.log('Batch created:', batch.id);
    console.log('Status:', batch.status);
    console.log('Items:', batch.item_count);
  } catch (err) {
    if (err instanceof BatchTubeApiError) {
      if (err.code === 'cli_access_not_allowed') {
        console.error('CLI access requires a Pro or Ultra plan. Please upgrade your plan to use the CLI.');
      } else if (err.code === 'upscale_4k_not_allowed') {
        console.error('4K quality is only available on the Ultra plan. Try 1080p or upgrade to Ultra.');
      } else if (err.code === 'plan_limit_reached' || err.code === 'insufficient_credits') {
        console.error('You have reached your monthly video limit for your current plan.');
      } else {
        console.error(err.message);
      }
      process.exit(err.statusCode >= 500 ? 2 : 1);
    }
    throw err;
  }
}
