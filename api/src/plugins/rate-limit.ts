import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { redis } from '../services/redis.js';
import { PLAN_LIMITS } from '../services/plans.js';
import { sendError } from '../utils/errors.js';

const rateLimitPlugin: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', async (request, reply) => {
    if (!request.url.startsWith('/v1') || !request.auth) return;

    const limits = PLAN_LIMITS[request.auth.plan];
    const now = new Date();
    const windowStartMs = Math.floor(now.getTime() / 60000) * 60000;
    const windowEndMs = windowStartMs + 60000;

    const key = `ratelimit:${request.auth.apiKey.id}:${windowStartMs}`;
    const used = await redis.incr(key);
    if (used === 1) {
      await redis.pexpire(key, 60000);
    }

    const remaining = Math.max(0, limits.requestsPerMinute - used);
    const resetAtIso = new Date(windowEndMs).toISOString();

    reply.header('X-RateLimit-Limit', String(limits.requestsPerMinute));
    reply.header('X-RateLimit-Remaining', String(remaining));
    reply.header('X-RateLimit-Reset', resetAtIso);

    if (used > limits.requestsPerMinute) {
      const retryAfter = Math.max(1, Math.ceil((windowEndMs - now.getTime()) / 1000));
      return sendError(request, reply, 429, 'rate_limit_exceeded', 'You have exceeded your plan limits.', {
        retry_after: retryAfter
      });
    }
  });
};

export default fp(rateLimitPlugin);
