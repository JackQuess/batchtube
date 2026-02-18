import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { redis } from '../services/redis.js';
import { sendError } from '../utils/errors.js';

const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const idempotencyPlugin: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', async (request, reply) => {
    if (!request.auth || request.method !== 'POST' || request.url !== '/v1/batches') return;

    const key = request.headers['idempotency-key'];
    if (!key) return;
    if (typeof key !== 'string' || !UUID_RE.test(key)) {
      return sendError(request, reply, 400, 'validation_error', 'Idempotency-Key must be a valid UUID.', {
        field: 'Idempotency-Key'
      });
    }

    const redisKey = `idempotency:${request.auth.user.id}:${request.url}:${key}`;
    const cached = await redis.get(redisKey);
    if (!cached) return;

    const payload = JSON.parse(cached) as { statusCode: number; body: unknown };
    return reply.status(payload.statusCode).send(payload.body);
  });

  app.addHook('onSend', async (request, reply, payload) => {
    if (!request.auth || request.method !== 'POST' || request.url !== '/v1/batches') return payload;

    const key = request.headers['idempotency-key'];
    if (!key || typeof key !== 'string' || !UUID_RE.test(key)) return payload;
    if (reply.statusCode !== 201) return payload;

    const redisKey = `idempotency:${request.auth.user.id}:${request.url}:${key}`;
    const body = typeof payload === 'string' ? JSON.parse(payload) : payload;
    await redis.set(redisKey, JSON.stringify({ statusCode: 201, body }), 'EX', IDEMPOTENCY_TTL_SECONDS);
    return payload;
  });
};

export default fp(idempotencyPlugin);
