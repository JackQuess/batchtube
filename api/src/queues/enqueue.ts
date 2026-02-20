import { defaultQueue } from './bull.js';
import type { SaaSPlan } from '../services/plans.js';

export async function enqueueBatch(batchId: string, userId: string, plan: SaaSPlan) {
  const priorityByPlan: Record<SaaSPlan, number> = {
    enterprise: 1,
    archivist: 2,
    pro: 4,
    free: 8
  };

  await defaultQueue.add('process-batch', { batchId, userId }, {
    jobId: `batch:${batchId}`,
    priority: priorityByPlan[plan],
    removeOnComplete: true,
    removeOnFail: 200
  });
}
