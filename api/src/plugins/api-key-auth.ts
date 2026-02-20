import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../services/db.js';
import { normalizePlan, type SaaSPlan } from '../services/plans.js';
import { sendError } from '../utils/errors.js';
import { sha256 } from '../utils/crypto.js';
import type { AuthContext } from '../types/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}

const API_ENABLED: SaaSPlan[] = ['archivist', 'enterprise'];

const verifyApiKeyPlugin: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', async (request, reply) => {
    if (!request.url.startsWith('/v1/api/')) return;

    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header');
    }

    const token = authorization.slice(7).trim();
    if (!token.startsWith('bt_live_')) {
      return sendError(request, reply, 401, 'unauthorized', 'Invalid API key format');
    }

    const apiKey = await prisma.apiKey.findFirst({
      where: { key_hash: sha256(token) },
      include: { user: true }
    });

    if (!apiKey || apiKey.user.disabled) {
      return sendError(request, reply, 401, 'unauthorized', 'Invalid API key');
    }

    const profile = await prisma.profile.findUnique({
      where: { id: apiKey.user_id },
      select: { plan: true }
    });
    const plan = normalizePlan(profile?.plan);
    if (!API_ENABLED.includes(plan)) {
      return sendError(request, reply, 403, 'forbidden', 'API access requires Archivist or Enterprise.');
    }

    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { last_used_at: new Date() }
    });

    request.auth = {
      user: apiKey.user,
      apiKey,
      tokenType: 'api_key',
      plan
    };
  });
};

export default fp(verifyApiKeyPlugin);

