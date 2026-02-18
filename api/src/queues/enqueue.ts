import type { PlanTier } from '@prisma/client';
import { priorityQueue, standardQueue } from './bull.js';

export async function enqueueBatch(batchId: string, userId: string, plan: PlanTier) {
  const queue = plan === 'archivist' || plan === 'enterprise' ? priorityQueue : standardQueue;
  await queue.add('process-batch', { batchId, userId }, {
    jobId: `batch:${batchId}`,
    removeOnComplete: true,
    removeOnFail: 200
  });
}
