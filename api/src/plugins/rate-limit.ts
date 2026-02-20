import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { redis } from '../services/redis.js';
import { PLAN_LIMITS, getPlan } from '../services/plans.js';
import { sendError } from '../utils/errors.js';

const rateLimitPlugin: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', async (request, reply) => {
    if (!request.url.startsWith('/v1') || !request.auth) return;

    const plan = await getPlan(request.auth.user.id);
    const limits = PLAN_LIMITS[plan];
    const now = new Date();
    const windowStartMs = Math.floor(now.getTime() / 60000) * 60000;
    const windowEndMs = windowStartMs + 60000;

    const principal = request.auth.user.id;
    const abuseBlockedKey = `abuse:block:${principal}`;
    const blocked = await redis.get(abuseBlockedKey);
    if (blocked === '1') {
      return sendError(request, reply, 429, 'rate_limit_exceeded', 'Temporarily blocked due to abusive request pattern.', {
        retry_after: 300
      });
    }

    const key = `ratelimit:${principal}:${windowStartMs}`;
    const used = await redis.incr(key);
    if (used === 1) {
      await redis.pexpire(key, 60000);
    }

    const remaining = Math.max(0, limits.rateLimitPerMinute - used);
    const resetAtIso = new Date(windowEndMs).toISOString();

    reply.header('X-RateLimit-Limit', String(limits.rateLimitPerMinute));
    reply.header('X-RateLimit-Remaining', String(remaining));
    reply.header('X-RateLimit-Reset', resetAtIso);

    if (used > limits.rateLimitPerMinute) {
      const retryAfter = Math.max(1, Math.ceil((windowEndMs - now.getTime()) / 1000));
      return sendError(request, reply, 429, 'rate_limit_exceeded', 'You have exceeded your plan limits.', {
        retry_after: retryAfter
      });
    }
  });

  app.addHook('onResponse', async (request, reply) => {
    if (!request.url.startsWith('/v1') || !request.auth) return;
    const principal = request.auth.user.id;
    const totalKey = `abuse:total:${principal}`;
    const errorsKey = `abuse:4xx:${principal}`;

    await redis.multi()
      .incr(totalKey)
      .expire(totalKey, 300)
      .exec();

    if (reply.statusCode >= 400 && reply.statusCode < 500) {
      await redis.multi()
        .incr(errorsKey)
        .expire(errorsKey, 300)
        .exec();
    }

    const [totalRaw, errorsRaw] = await Promise.all([redis.get(totalKey), redis.get(errorsKey)]);
    const total = Number(totalRaw ?? '0');
    const errors = Number(errorsRaw ?? '0');

    if (total >= 20 && errors / total > 0.5) {
      await redis.set(`abuse:block:${principal}`, '1', 'EX', 300);
    }
  });
};

export default fp(rateLimitPlugin);
