import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { Prisma, type User } from '@prisma/client';
import { config } from '../config.js';
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

type ProfileRow = {
  id: string;
  plan: string | null;
};

const FALLBACK_PASSWORD_HASH = '__supabase_jwt_auth__';

/** Plans that allow API key access to main /v1 routes (batches, files, account). */
const API_KEY_PLANS: SaaSPlan[] = ['archivist', 'enterprise'];

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
  } catch {
    return null;
  }
}

async function autoCreateProfileIfMissing(userId: string) {
  try {
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO profiles (id)
      VALUES (${userId}::uuid)
      ON CONFLICT (id) DO NOTHING
    `);
  } catch {
    // Table missing or FK (user not in users): ignore
  }
}

async function ensureUserRecord(userId: string, email: string | null): Promise<User> {
  const safeEmail = email || `${userId}@supabase.local`;
  const fallback: User = {
    id: userId,
    email: safeEmail,
    password_hash: FALLBACK_PASSWORD_HASH,
    plan: 'starter',
    disabled: false,
    stripe_customer_id: null,
    webhook_secret: null,
    created_at: new Date(),
    updated_at: new Date()
  } as User;
  try {
    return await prisma.user.upsert({
      where: { id: userId },
      update: { email: safeEmail },
      create: {
        id: userId,
        email: safeEmail,
        password_hash: FALLBACK_PASSWORD_HASH
      }
    });
  } catch (error: any) {
    // Email collision: retry with deterministic email
    if (error?.code === 'P2002') {
      try {
        return await prisma.user.upsert({
          where: { id: userId },
          update: { email: `${userId}@supabase.local` },
          create: {
            id: userId,
            email: `${userId}@supabase.local`,
            password_hash: FALLBACK_PASSWORD_HASH
          }
        });
      } catch {
        return fallback;
      }
    }
    // Table missing (42P01), connection error, or other Prisma error: continue with fallback user
    return fallback;
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

    // API key auth (CLI / developer): Bearer bt_live_...
    if (token.startsWith('bt_live_')) {
      const apiKey = await prisma.apiKey.findFirst({
        where: { key_hash: sha256(token) },
        include: { user: true }
      });

      if (!apiKey || apiKey.user.disabled) {
        request.log.warn(
          { requestId: request.id, path: request.url, hasKey: !!apiKey, userDisabled: apiKey?.user?.disabled },
          'auth_api_key_invalid'
        );
        return sendError(request, reply, 401, 'unauthorized', 'Invalid API key');
      }

      const profile = await prisma.profile.findUnique({
        where: { id: apiKey.user_id },
        select: { plan: true }
      });
      const plan = normalizePlan(profile?.plan);
      if (!API_KEY_PLANS.includes(plan)) {
        request.log.warn(
          { requestId: request.id, userId: apiKey.user_id, plan },
          'auth_api_key_plan_forbidden'
        );
        return sendError(request, reply, 403, 'forbidden', 'API access requires Archivist or Enterprise.');
      }

      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { last_used_at: new Date() }
      });

      request.log.info(
        { requestId: request.id, userId: apiKey.user_id, plan, authType: 'api_key' },
        'auth_resolved'
      );

      request.auth = {
        user: apiKey.user,
        apiKey,
        tokenType: 'api_key',
        plan
      };
      return;
    }

    // JWT auth (web app): Supabase JWT
    if (request.url.startsWith('/v1/api/')) return;

    let payload: JWTPayload;
    try {
      payload = await verifySupabaseJWT(token);
    } catch (err) {
      request.log.warn(
        { requestId: request.id, error: err instanceof Error ? err.message : String(err), path: request.url },
        'auth_jwt_verify_failed'
      );
      return sendError(request, reply, 401, 'unauthorized', 'Invalid or expired token');
    }

    const sub = payload.sub;
    if (!sub) {
      return sendError(request, reply, 401, 'unauthorized', 'Token subject is missing');
    }

    const jwtEmail = typeof payload.email === 'string' ? payload.email : null;
    const fallbackUser = {
      id: sub,
      email: jwtEmail || `${sub}@supabase.local`,
      password_hash: FALLBACK_PASSWORD_HASH,
      plan: 'starter',
      disabled: false,
      stripe_customer_id: null,
      webhook_secret: null,
      created_at: new Date(),
      updated_at: new Date()
    } as User;

    let user = fallbackUser;
    let profile: ProfileRow | null = null;
    try {
      user = await ensureUserRecord(sub, jwtEmail);
      profile = await getProfileFromProfilesTable(sub);
      if (!profile) {
        await autoCreateProfileIfMissing(sub);
        profile = await getProfileFromProfilesTable(sub);
      }
    } catch (error) {
      request.log.error({ err: error, requestId: request.id, userId: sub }, 'auth_user_profile_sync_failed');
    }

    const effectivePlan = normalizePlan(profile?.plan);

    const appMeta = payload.app_metadata && typeof payload.app_metadata === 'object' ? payload.app_metadata as Record<string, unknown> : null;
    const role = appMeta?.role;
    const isOwner = appMeta?.is_owner;
    const isAdmin = payload.role === 'service_role' || role === 'admin' || role === 'owner' || isOwner === true;

    request.log.info(
      {
        userId: sub,
        isAdmin,
        authType: 'jwt',
        authDiagnostic: {
          payloadRole: payload.role ?? null,
          appMetaRole: role ?? null,
          appMetaIsOwner: isOwner ?? null,
          hasAppMeta: !!appMeta
        }
      },
      'auth_resolved'
    );

    request.auth = {
      user,
      tokenType: 'supabase_jwt',
      plan: effectivePlan,
      isAdmin: isAdmin || undefined
    };
  });
};

export default fp(authPlugin);
