import bcrypt from 'bcryptjs';
import fp from 'fastify-plugin';
import cookie from '@fastify/cookie';
import type { FastifyPluginAsync } from 'fastify';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config.js';
import { redis } from '../services/redis.js';
import { writeAuditLog } from '../services/audit.js';
import { sendError } from '../utils/errors.js';
import type { AdminSession } from '../types/index.js';
import { prisma } from '../services/db.js';

declare module 'fastify' {
  interface FastifyRequest {
    admin?: AdminSession;
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const COOKIE_NAME = 'bt_admin_session';

function getLoginLimitKey(ip: string): string {
  const windowStart = Math.floor(Date.now() / (10 * 60 * 1000));
  return `admin:login:${ip}:${windowStart}`;
}

const adminAuthPlugin: FastifyPluginAsync = async (app) => {
  app.register(cookie);
  app.decorateRequest('admin', undefined);

  app.addHook('preHandler', async (request, reply) => {
    if (!request.url.startsWith('/admin-api')) return;
    if (request.url === '/admin-api/login') return;

    const token = request.cookies[COOKIE_NAME];
    if (!token) {
      return sendError(request, reply, 401, 'unauthorized', 'Admin session required.');
    }

    try {
      const decoded = jwt.verify(token, config.admin.jwtSecret) as AdminSession;
      request.admin = { email: decoded.email };
    } catch {
      return sendError(request, reply, 401, 'unauthorized', 'Invalid admin session.');
    }
  });

  app.post('/admin-api/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid request body.', {
        issues: parsed.error.issues
      });
    }

    const ip = request.ip ?? 'unknown';
    const key = getLoginLimitKey(ip);
    const attempts = await redis.incr(key);
    if (attempts === 1) {
      await redis.expire(key, 10 * 60);
    }
    if (attempts > 10) {
      return sendError(request, reply, 429, 'rate_limit_exceeded', 'Too many login attempts.', {
        retry_after_seconds: 600
      });
    }

    const { email, password } = parsed.data;
    if (!config.admin.email || !config.admin.passwordHash || !config.admin.jwtSecret) {
      return sendError(request, reply, 500, 'internal_server_error', 'Admin auth is not configured.');
    }

    const emailOk = email.toLowerCase() === config.admin.email.toLowerCase();
    const passwordOk = emailOk ? await bcrypt.compare(password, config.admin.passwordHash) : false;

    if (!emailOk || !passwordOk) {
      return sendError(request, reply, 401, 'unauthorized', 'Invalid admin credentials.');
    }

    const token = jwt.sign({ email }, config.admin.jwtSecret, { expiresIn: '12h' });

    reply.setCookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: config.nodeEnv === 'production',
      path: '/'
    });

    const matchedUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    await writeAuditLog({ request, userId: matchedUser?.id, action: 'admin.login' });

    return reply.send({ ok: true });
  });

  app.post('/admin-api/logout', async (request, reply) => {
    reply.clearCookie(COOKIE_NAME, { path: '/' });
    await writeAuditLog({ request, action: 'admin.logout' });
    return reply.send({ ok: true });
  });
};

export default fp(adminAuthPlugin);
