import type { FastifyPluginAsync } from 'fastify';
import { writeAuditLog } from '../services/audit.js';
import { PLAN_LIMITS, getPlan } from '../services/plans.js';
import { getCycleReset, getOrCreateUsageCounter } from '../services/usage.js';
import { sendError } from '../utils/errors.js';

const accountRoute: FastifyPluginAsync = async (app) => {
  app.get('/v1/account/usage', async (request, reply) => {
    if (!request.auth) return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header.');

    const plan = await getPlan(request.auth.user.id);
    const usage = await getOrCreateUsageCounter(request.auth.user.id);
    const limits = PLAN_LIMITS[plan];

    await writeAuditLog({
      request,
      userId: request.auth.user.id,
      action: 'account.usage'
    });

    return reply.send({
      plan,
      cycle_reset: getCycleReset(),
      limits: {
        bandwidth_bytes: 0,
        monthly_downloads: limits.monthlyBatches,
        concurrency: limits.concurrency
      },
      used: {
        bandwidth_bytes: Number(usage.bandwidth_bytes),
        monthly_downloads: usage.batches_processed
      }
    });
  });
};

export default accountRoute;
