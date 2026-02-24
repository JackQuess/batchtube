import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { Prisma, type User } from '@prisma/client';
import { config } from '../config.js';
import { prisma } from '../services/db.js';
import { normalizePlan } from '../services/plans.js';
import { sendError } from '../utils/errors.js';
import type { AuthContext } from '../types/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}

type ProfileRow = {
  id: string;
  plan: string | null;
};

const FALLBACK_PASSWORD_HASH = '__supabase_jwt_auth__';

const supabaseUrl = config.supabase.url.replace(/\/+$/, '');
const jwksUrl = config.supabase.jwksUrl || (supabaseUrl ? `${supabaseUrl}/auth/v1/.well-known/jwks.json` : '');
const jwtIssuer = config.supabase.jwtIssuer || (supabaseUrl ? `${supabaseUrl}/auth/v1` : '');
const jwks = jwksUrl ? createRemoteJWKSet(new URL(jwksUrl)) : null;

async function getProfileFromProfilesTable(userId: string): Promise<ProfileRow | null> {
  try {
    const rows = await prisma.$queryRaw<ProfileRow[]>(Prisma.sql`
      SELECT id::text AS id, plan::text AS plan
      FROM profiles
      WHERE id = ${userId}::uuid
      LIMIT 1
    `);
    return rows[0] ?? null;
  } catch (error: any) {
    if (error?.code === '42P01') return null; // profiles table not found
    throw error;
  }
}

async function autoCreateProfileIfMissing(userId: string) {
  try {
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO profiles (id)
      VALUES (${userId}::uuid)
      ON CONFLICT (id) DO NOTHING
    `);
  } catch (error: any) {
    if (error?.code !== '42P01') throw error;
  }
}

async function ensureUserRecord(userId: string, email: string | null): Promise<User> {
  const safeEmail = email || `${userId}@supabase.local`;
  try {
    return await prisma.user.upsert({
      where: { id: userId },
      update: {
        email: safeEmail
      },
      create: {
        id: userId,
        email: safeEmail,
        password_hash: FALLBACK_PASSWORD_HASH
      }
    });
  } catch (error: any) {
    // Email may collide with an existing legacy row. Keep user auth path alive with a deterministic fallback email.
    if (error?.code !== 'P2002') throw error;

    return prisma.user.upsert({
      where: { id: userId },
      update: {
        email: `${userId}@supabase.local`
      },
      create: {
        id: userId,
        email: `${userId}@supabase.local`,
        password_hash: FALLBACK_PASSWORD_HASH
      }
    });
  }
}

export async function verifySupabaseJWT(token: string): Promise<JWTPayload> {
  if (!jwks || !jwtIssuer) {
    throw new Error('Supabase JWT configuration missing.');
  }
  const { payload } = await jwtVerify(token, jwks, {
    issuer: jwtIssuer,
    audience: config.supabase.jwtAudience
  });
  return payload;
}

const authPlugin: FastifyPluginAsync = async (app) => {
  app.decorateRequest('auth', undefined);

  app.addHook('preHandler', async (request, reply) => {
    if (request.method === 'OPTIONS') return;
    if (request.url === '/health') return;
    if (!request.url.startsWith('/v1')) return;

    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header');
    }

    const token = authorization.slice(7).trim();
    if (request.url.startsWith('/v1/api/')) return;

    let payload: JWTPayload;
    try {
      payload = await verifySupabaseJWT(token);
    } catch {
      return sendError(request, reply, 401, 'unauthorized', 'Invalid or expired token');
    }

    const sub = payload.sub;
    if (!sub) {
      return sendError(request, reply, 401, 'unauthorized', 'Token subject is missing');
    }

    const jwtEmail = typeof payload.email === 'string' ? payload.email : null;
    const user = await ensureUserRecord(sub, jwtEmail);
    let profile = await getProfileFromProfilesTable(sub);
    if (!profile) {
      await autoCreateProfileIfMissing(sub);
      profile = await getProfileFromProfilesTable(sub);
    }

    const effectivePlan = normalizePlan(profile?.plan);

    request.auth = {
      user,
      tokenType: 'supabase_jwt',
      plan: effectivePlan
    };
  });
};

export default fp(authPlugin);
