import type { FastifyPluginAsync } from 'fastify';
import { writeAuditLog } from '../services/audit.js';
import { PLAN_LIMITS } from '../services/plans.js';
import { getCycleReset, getOrCreateUsageCounter } from '../services/usage.js';
import { sendError } from '../utils/errors.js';

const accountRoute: FastifyPluginAsync = async (app) => {
  app.get('/v1/account/usage', async (request, reply) => {
    if (!request.auth) return sendError(request, reply, 401, 'unauthorized', 'Missing API key.');

    const usage = await getOrCreateUsageCounter(request.auth.user.id);
    const limits = PLAN_LIMITS[request.auth.plan];

    await writeAuditLog({
      request,
      userId: request.auth.user.id,
      action: 'account.usage'
    });

    return reply.send({
      plan: request.auth.plan,
      cycle_reset: getCycleReset(),
      limits: {
        bandwidth_bytes: Number(limits.bandwidthBytes),
        monthly_downloads: limits.monthlyDownloads,
        concurrency: limits.concurrency
      },
      used: {
        bandwidth_bytes: Number(usage.bandwidth_bytes),
        monthly_downloads: usage.items_processed
      }
    });
  });
};

export default accountRoute;
