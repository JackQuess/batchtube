import { Queue } from 'bullmq';
import { config } from '../config.js';

export interface BatchJob {
  batchId: string;
  userId: string;
}
export type BatchJobName = 'process-batch';

export const standardQueue = new Queue<BatchJob, void, BatchJobName>('batchtube-standard', {
  connection: { url: config.redisUrl }
});

export const priorityQueue = new Queue<BatchJob, void, BatchJobName>('batchtube-priority', {
  connection: { url: config.redisUrl }
});
