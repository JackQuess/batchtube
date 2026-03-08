import { loadConfig } from '../config.js';
import { listFiles, BatchTubeApiError } from '../api.js';
import { tableFormat, formatBytes, formatDate } from '../output.js';

export interface FilesOptions {
  json?: boolean;
  apiBaseUrl?: string;
}

export async function runFiles(opts: FilesOptions): Promise<void> {
  const config = loadConfig(opts.apiBaseUrl);
  if (!config) {
    console.error('Run `batchtube login` first.');
    process.exit(1);
  }
  const base = (opts.apiBaseUrl ?? config.apiBaseUrl).replace(/\/+$/, '');

  try {
    const res = await listFiles(base, config.apiKey, 1, 100);
    if (opts.json) {
      console.log(JSON.stringify(res ?? { data: [], meta: { page: 1, total: 0 } }, null, 2));
      return;
    }
    const data = res?.data ?? [];
    if (data.length === 0) {
      console.log('No files.');
      return;
    }
    const rows = data.map((f) => ({
      id: f.id,
      name: f.filename ?? f.name ?? f.id,
      size: formatBytes(f.size),
      expires: formatDate(f.expires_at ?? f.expires ?? '')
    }));
    console.log(tableFormat(rows));
  } catch (err) {
    if (err instanceof BatchTubeApiError && err.statusCode === 404) {
      if (opts.json) {
        console.log(JSON.stringify({ error: 'endpoint_not_available', message: 'GET /v1/files is not implemented on this API. Use batch status and batch items to see file IDs.' }));
      } else {
        console.error('List files is not available on this API. Use `batchtube status <batchId>` and batch items to see file IDs.');
      }
      process.exit(0);
    }
    if (err instanceof BatchTubeApiError) {
      console.error(err.message);
      process.exit(err.statusCode >= 500 ? 2 : 1);
    }
    throw err;
  }
}
