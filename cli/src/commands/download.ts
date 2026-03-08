import { loadConfig } from '../config.js';
import { createBatch, BatchTubeApiError } from '../api.js';

type Format = 'mp4' | 'mp3';
type Quality = 'best' | '1080p' | '720p';

export interface DownloadOptions {
  format?: Format;
  quality?: Quality;
  zip?: boolean;
  json?: boolean;
  apiBaseUrl?: string;
}

export async function runDownload(url: string, opts: DownloadOptions): Promise<void> {
  const config = loadConfig(opts.apiBaseUrl);
  if (!config) {
    console.error('Run `batchtube login` first.');
    process.exit(1);
  }
  const base = (opts.apiBaseUrl ?? config.apiBaseUrl).replace(/\/+$/, '');

  if (!url?.trim()) {
    console.error('Usage: batchtube download <url>');
    process.exit(1);
  }

  const format = (opts.format ?? 'mp4') as 'mp4' | 'mp3';
  const quality = (opts.quality ?? 'best') as 'best' | '1080p' | '720p';

  if (!opts.json) console.log('Creating batch...');
  try {
    const batch = await createBatch(base, config.apiKey, {
      urls: [url.trim()],
      options: {
        format: format === 'mp3' ? 'mp3' : 'mp4',
        quality,
        archive_as_zip: opts.zip ?? false
      },
      auto_start: true
    });
    if (opts.json) {
      console.log(JSON.stringify(batch, null, 2));
      return;
    }
    console.log('Batch created:', batch.id);
    console.log('Status:', batch.status);
  } catch (err) {
    if (err instanceof BatchTubeApiError) {
      console.error(err.message);
      process.exit(err.statusCode >= 500 ? 2 : 1);
    }
    throw err;
  }
}
