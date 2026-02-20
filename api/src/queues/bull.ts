import { Queue } from 'bullmq';
import { config } from '../config.js';

export interface BatchJob {
  batchId: string;
  userId: string;
}
export type BatchJobName = 'process-batch';

export const defaultQueue = new Queue<BatchJob, void, BatchJobName>('batchtube-default', {
  connection: { url: config.redisUrl }
});
