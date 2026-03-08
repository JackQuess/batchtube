import { loadConfig } from '../config.js';
import { getFileDownload, BatchTubeApiError } from '../api.js';
import { spawn } from 'node:child_process';
import { platform } from 'node:os';

export interface DownloadFileOptions {
  json?: boolean;
  open?: boolean;
  apiBaseUrl?: string;
}

function openUrl(url: string): void {
  const args = platform() === 'win32' ? ['/c', 'start', '', url] : [url];
  const cmd = platform() === 'win32' ? 'cmd' : platform() === 'darwin' ? 'open' : 'xdg-open';
  const p = spawn(cmd, args, { stdio: 'ignore', shell: platform() === 'win32' });
  p.on('error', (err) => console.error('Tarayıcı açılamadı:', err.message));
}

export async function runDownloadFile(fileId: string, opts: DownloadFileOptions): Promise<void> {
  const config = loadConfig(opts.apiBaseUrl);
  if (!config) {
    console.error('Run `batchtube login` first.');
    process.exit(1);
  }
  const base = (opts.apiBaseUrl ?? config.apiBaseUrl).replace(/\/+$/, '');

  if (!fileId?.trim()) {
    console.error('Usage: batchtube download-file <fileId>');
    process.exit(1);
  }

  try {
    const res = await getFileDownload(base, config.apiKey, fileId.trim());
    if (opts.json) {
      console.log(JSON.stringify(res, null, 2));
      if (opts.open) openUrl(res.url);
      return;
    }
    console.log(res.url);
    console.log('Expires:', res.expires_at);
    if (opts.open) openUrl(res.url);
  } catch (err) {
    if (err instanceof BatchTubeApiError) {
      if (err.statusCode === 404) console.error('File not found:', fileId);
      else console.error(err.message);
      process.exit(err.statusCode >= 500 ? 2 : 1);
    }
    throw err;
  }
}
