import { Queue } from 'bullmq';
import { config } from '../config.js';
import { QUEUE_NAME } from '../runtime-config.js';

export interface BatchJob {
  batchId: string;
  userId: string;
}

export interface ItemJob {
  batchId: string;
  itemId: string;
  userId: string;
}

export type BatchJobName = 'process-batch' | 'channel-archive' | 'process-item' | 'batch-finalize';

export const defaultQueue = new Queue<BatchJob | ItemJob, void, BatchJobName>(QUEUE_NAME, {
  connection: { url: config.redisUrl }
});
