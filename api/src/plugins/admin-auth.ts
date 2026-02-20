import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import type { JWTPayload } from 'jose';
import { sendError } from '../utils/errors.js';
import { verifySupabaseJWT } from './auth.js';
import type { AdminSession } from '../types/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    admin?: AdminSession;
  }
}

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
};

const isAdminPayload = (payload: JWTPayload): boolean => {
  if (payload.role === 'service_role') return true;

  const appMeta = asRecord(payload.app_metadata);
  if (!appMeta) return false;

  const role = appMeta.role;
  const isOwner = appMeta.is_owner;
  return role === 'admin' || role === 'owner' || isOwner === true;
};

const adminAuthPlugin: FastifyPluginAsync = async (app) => {
  app.decorateRequest('admin', undefined);

  app.addHook('preHandler', async (request, reply) => {
    if (!request.url.startsWith('/admin-api')) return;

    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header');
    }

    const token = authorization.slice(7).trim();

    let payload: JWTPayload;
    try {
      payload = await verifySupabaseJWT(token);
    } catch {
      return sendError(request, reply, 401, 'unauthorized', 'Invalid or expired token');
    }

    if (!isAdminPayload(payload)) {
      return sendError(request, reply, 403, 'forbidden', 'Admin access required.');
    }

    request.admin = {
      email: typeof payload.email === 'string' ? payload.email : 'admin@unknown'
    };
  });
};

export default fp(adminAuthPlugin);

