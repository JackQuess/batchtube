import type { FastifyPluginAsync } from 'fastify';
import { writeAuditLog } from '../services/audit.js';
import { getCreditsUsage, getPlan } from '../services/plans.js';
import { getCycleReset } from '../services/usage.js';
import { sendError } from '../utils/errors.js';

const accountRoute: FastifyPluginAsync = async (app) => {
  app.get('/v1/account/usage', async (request, reply) => {
    if (!request.auth) return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header.');

    let plan: 'free' | 'pro' | 'archivist' | 'enterprise' = 'free';
    let credits = { used: 0, limit: 100, available: 100 };
    try {
      plan = await getPlan(request.auth.user.id);
      credits = await getCreditsUsage(request.auth.user.id, plan);
    } catch (error) {
      request.log.error({ err: error, requestId: request.id, userId: request.auth.user.id }, 'account_usage_compute_failed');
    }

    await writeAuditLog({
      request,
      userId: request.auth.user.id,
      action: 'account.usage'
    });

    return reply.send({
      plan,
      cycle_reset: getCycleReset(),
      credits: {
        used: credits.used,
        limit: credits.limit,
        available: credits.available
      }
    });
  });
};

export default accountRoute;
