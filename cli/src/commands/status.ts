import { loadConfig } from '../config.js';
import { getBatch, BatchTubeApiError } from '../api.js';

export interface StatusOptions {
  json?: boolean;
  apiBaseUrl?: string;
}

export async function runStatus(batchId: string, opts: StatusOptions): Promise<void> {
  const config = loadConfig(opts.apiBaseUrl);
  if (!config) {
    console.error('Run `batchtube login` first.');
    process.exit(1);
  }
  const base = (opts.apiBaseUrl ?? config.apiBaseUrl).replace(/\/+$/, '');

  if (!batchId?.trim()) {
    console.error('Usage: batchtube status <batchId>');
    process.exit(1);
  }

  try {
    const batch = await getBatch(base, config.apiKey, batchId.trim());
    if (opts.json) {
      console.log(JSON.stringify(batch, null, 2));
      return;
    }
    console.log('Batch', batch.id);
    console.log('Status:', batch.status);
    console.log('Items:', batch.item_count, 'total');
    console.log('Progress:', Math.round(batch.progress) + '%');
    const zipReady = batch.status === 'completed';
    console.log('ZIP ready:', zipReady ? 'yes' : 'no');
  } catch (err) {
    if (err instanceof BatchTubeApiError) {
      if (err.statusCode === 404) {
        console.error('Batch not found:', batchId);
      } else {
        console.error(err.message);
      }
      process.exit(err.statusCode >= 500 ? 2 : 1);
    }
    throw err;
  }
}
