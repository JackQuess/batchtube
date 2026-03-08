import { loadConfig } from '../config.js';
import { createArchive, BatchTubeApiError } from '../api.js';

type Format = 'mp4' | 'mp3';
type Quality = 'best' | '1080p' | '720p';

export type ArchiveMode = 'latest_25' | 'latest_n' | 'all' | 'select';

export interface ArchiveOptions {
  format?: Format;
  quality?: Quality;
  zip?: boolean;
  json?: boolean;
  apiBaseUrl?: string;
  mode?: ArchiveMode;
  latest?: number;
}

export async function runArchive(sourceUrl: string, opts: ArchiveOptions): Promise<void> {
  const config = loadConfig(opts.apiBaseUrl);
  if (!config) {
    console.error('Run `batchtube login` first.');
    process.exit(1);
  }
  const base = (opts.apiBaseUrl ?? config.apiBaseUrl).replace(/\/+$/, '');

  if (!sourceUrl?.trim()) {
    console.error('Usage: batchtube archive <channel-url> [--latest N] [--all] [--select]');
    process.exit(1);
  }

  const url = sourceUrl.trim().startsWith('http') ? sourceUrl.trim() : `https://${sourceUrl.trim()}`;
  const mode = opts.mode ?? 'latest_25';
  const latestN = mode === 'latest_n' && opts.latest != null ? Math.min(500, Math.max(1, opts.latest)) : undefined;

  if (!opts.json) console.log('Starting archive (channel will resolve in background)...');
  try {
    const res = await createArchive(base, config.apiKey, {
      source_url: url,
      mode,
      latest_n: latestN,
      options: {
        format: (opts.format ?? 'mp4') as 'mp4' | 'mp3' | 'mkv',
        quality: (opts.quality ?? 'best') as 'best' | '4k' | '1080p' | '720p',
        archive_as_zip: opts.zip ?? false
      }
    });
    if (opts.json) {
      console.log(JSON.stringify(res, null, 2));
      return;
    }
    console.log('Batch created:', res.id);
    console.log('Status:', res.status);
    if (res.channel_detected && res.channel) {
      console.log('Channel:', res.channel.title);
    }
    console.log('Use `batchtube status', res.id, '` to poll progress.');
  } catch (err) {
    if (err instanceof BatchTubeApiError) {
      console.error(err.message);
      process.exit(err.statusCode >= 500 ? 2 : 1);
    }
    throw err;
  }
}
