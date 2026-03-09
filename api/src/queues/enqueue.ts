import { defaultQueue, processingQueue } from './bull.js';
import type { SaaSPlan } from '../services/plans.js';

const priorityByPlan: Record<SaaSPlan, number> = {
  enterprise: 1,
  archivist: 2,
  pro: 4,
  free: 8
};

/** Enqueue a single batch-level job (legacy). Prefer enqueueBatchItems for throughput. */
export async function enqueueBatch(batchId: string, userId: string, plan: SaaSPlan) {
  await defaultQueue.add('process-batch', { batchId, userId }, {
    jobId: `batch-${batchId}`,
    priority: priorityByPlan[plan],
    removeOnComplete: true,
    removeOnFail: 200
  });
}

/** Enqueue one job per item for parallel processing. Use after batch + items are created. */
export async function enqueueBatchItems(
  batchId: string,
  userId: string,
  itemIds: string[],
  plan: SaaSPlan
): Promise<void> {
  const priority = priorityByPlan[plan];
  const jobs = itemIds.map((itemId) => ({
    name: 'process-item' as const,
    data: { batchId, itemId, userId },
    opts: {
      jobId: `item-${batchId}-${itemId}`,
      priority,
      removeOnComplete: true,
      removeOnFail: 200
    }
  }));
  await defaultQueue.addBulk(jobs);
}

/** Enqueue batch finalization (zip + status + webhook). Called when all items are done. */
export async function enqueueBatchFinalize(batchId: string, userId: string, plan: SaaSPlan): Promise<void> {
  await defaultQueue.add('batch-finalize', { batchId, userId }, {
    jobId: `batch-finalize-${batchId}`,
    priority: priorityByPlan[plan],
    removeOnComplete: true,
    removeOnFail: 200
  });
}

export async function enqueueChannelArchive(batchId: string, userId: string, plan: SaaSPlan) {
  await defaultQueue.add('channel-archive', { batchId, userId }, {
    jobId: `channel-archive-${batchId}`,
    priority: priorityByPlan[plan],
    removeOnComplete: true,
    removeOnFail: 200
  });
}

export async function enqueueProcessingJob(
  batchId: string,
  itemId: string,
  userId: string,
  plan: SaaSPlan
): Promise<void> {
  await processingQueue.add('process-media', { batchId, itemId, userId }, {
    jobId: `processing-${batchId}-${itemId}`,
    priority: priorityByPlan[plan],
    removeOnComplete: true,
    removeOnFail: 200
  });
}
