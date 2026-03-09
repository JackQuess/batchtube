import { Queue } from 'bullmq';
import { config } from '../config.js';
import { QUEUE_NAME, QUEUE_NAME_PROCESSING } from '../runtime-config.js';

export interface BatchJob {
  batchId: string;
  userId: string;
}

export interface ItemJob {
  batchId: string;
  itemId: string;
  userId: string;
}

export interface ProcessingJob {
  batchId: string;
  itemId: string;
  userId: string;
}

export type BatchJobName = 'process-batch' | 'channel-archive' | 'process-item' | 'batch-finalize';

export type ProcessingJobName = 'process-media';

export const defaultQueue = new Queue<BatchJob | ItemJob, void, BatchJobName>(QUEUE_NAME, {
  connection: { url: config.redisUrl }
});

export const processingQueue = new Queue<ProcessingJob, void, ProcessingJobName>(QUEUE_NAME_PROCESSING, {
  connection: { url: config.redisUrl }
});
