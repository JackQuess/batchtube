import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../services/db.js';
import { sha256 } from '../utils/crypto.js';
import { sendError } from '../utils/errors.js';
import type { AuthContext } from '../types/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}

const authPlugin: FastifyPluginAsync = async (app) => {
  app.decorateRequest('auth', undefined);

  app.addHook('preHandler', async (request, reply) => {
    if (!request.url.startsWith('/v1')) return;

    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header');
    }

    const token = authorization.slice(7).trim();
    if (!token.startsWith('bt_live_')) {
      return sendError(request, reply, 401, 'unauthorized', 'Invalid API key format');
    }

    const keyPrefix = 'bt_live_';
    const keyHash = sha256(token);

    const apiKey = await prisma.apiKey.findFirst({
      where: {
        key_prefix: keyPrefix,
        key_hash: keyHash
      },
      include: { user: true }
    });

    if (!apiKey) {
      return sendError(request, reply, 401, 'unauthorized', 'Invalid API key');
    }

    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { last_used_at: new Date() }
    });

    request.auth = {
      user: apiKey.user,
      apiKey,
      token,
      plan: apiKey.user.plan
    };
  });
};

export default fp(authPlugin);
