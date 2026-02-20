import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/db.js';
import { getPlan } from '../services/plans.js';
import { generateApiKey } from '../utils/crypto.js';
import { sendError } from '../utils/errors.js';

const bodySchema = z.object({
  name: z.string().max(50).optional()
});

const idSchema = z.object({
  id: z.string().uuid()
});

const apiKeysRoute: FastifyPluginAsync = async (app) => {
  app.post('/v1/api-keys', async (request, reply) => {
    if (!request.auth) {
      return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header');
    }

    const plan = await getPlan(request.auth.user.id);
    if (plan !== 'archivist' && plan !== 'enterprise') {
      return sendError(request, reply, 403, 'forbidden', 'API keys are available for Archivist and Enterprise plans only.');
    }

    const parsed = bodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid request body.', {
        issues: parsed.error.issues
      });
    }

    const key = generateApiKey('bt_live_');
    const created = await prisma.apiKey.create({
      data: {
        user_id: request.auth.user.id,
        key_prefix: 'bt_live_',
        key_hash: key.hash,
        name: parsed.data.name ?? 'API Key'
      }
    });

    return reply.status(201).send({
      id: created.id,
      key: key.plain,
      created_at: created.created_at.toISOString()
    });
  });

  app.get('/v1/api-keys', async (request, reply) => {
    if (!request.auth) {
      return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header');
    }

    const plan = await getPlan(request.auth.user.id);
    if (plan !== 'archivist' && plan !== 'enterprise') {
      return sendError(request, reply, 403, 'forbidden', 'API keys are available for Archivist and Enterprise plans only.');
    }

    const rows = await prisma.apiKey.findMany({
      where: { user_id: request.auth.user.id },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        key_prefix: true,
        created_at: true,
        last_used_at: true,
        name: true
      }
    });

    return reply.send({
      data: rows.map((row) => ({
        id: row.id,
        key_prefix: row.key_prefix,
        name: row.name,
        created_at: row.created_at.toISOString(),
        last_used_at: row.last_used_at?.toISOString() ?? null
      }))
    });
  });

  app.delete('/v1/api-keys/:id', async (request, reply) => {
    if (!request.auth) {
      return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header');
    }

    const plan = await getPlan(request.auth.user.id);
    if (plan !== 'archivist' && plan !== 'enterprise') {
      return sendError(request, reply, 403, 'forbidden', 'API keys are available for Archivist and Enterprise plans only.');
    }

    const parsed = idSchema.safeParse(request.params);
    if (!parsed.success) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid key id.', {
        issues: parsed.error.issues
      });
    }

    const deleted = await prisma.apiKey.deleteMany({
      where: {
        id: parsed.data.id,
        user_id: request.auth.user.id
      }
    });

    if (deleted.count === 0) {
      return sendError(request, reply, 404, 'not_found', 'API key not found.');
    }

    return reply.send({ ok: true });
  });
};

export default apiKeysRoute;

