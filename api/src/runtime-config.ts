/**
 * Runtime configuration validation and startup diagnostics.
 * Ensures API/Worker use Railway Postgres + Railway Redis at runtime.
 * Supabase is for auth only (JWT); do not use Supabase Postgres for Prisma runtime.
 */

import { config } from './config.js';

export type DbHostCategory = 'railway_postgres' | 'supabase_host_detected' | 'local' | 'other';

/**
 * Derive DB host category from DATABASE_URL without logging the URL.
 */
export function getDbHostCategory(): DbHostCategory {
  const url = config.databaseUrl;
  if (!url || url.length === 0) return 'other';
  try {
    const parsed = new URL(url.replace(/^postgresql:\/\//, 'https://'));
    const host = (parsed.hostname || '').toLowerCase();
    if (host.includes('supabase.com') || host.includes('pooler.supabase.com')) {
      return 'supabase_host_detected';
    }
    if (host.includes('railway') || host.includes('containers-us') || host.includes('monorail')) {
      return 'railway_postgres';
    }
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'local';
    }
    return 'other';
  } catch {
    return 'other';
  }
}

export interface RuntimeValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate required runtime config. Fail-fast for DB and Redis.
 * @param options.role - If 'worker', Supabase warnings are skipped (worker does not verify JWT).
 */
export function validateRuntimeConfig(options?: { role?: 'api' | 'worker' }): RuntimeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isWorker = options?.role === 'worker';

  if (!config.databaseUrl || config.databaseUrl.trim() === '') {
    errors.push('DATABASE_URL is missing or empty. Set it to Railway Postgres (or local Postgres) connection string.');
  }

  if (!config.redisUrl || config.redisUrl.trim() === '') {
    errors.push('REDIS_URL is missing or empty. Set it to Railway Redis (or local Redis) connection string.');
  }

  if (!isWorker) {
    const supabaseUrl = config.supabase.url?.trim();
    const hasJwks = (config.supabase.jwksUrl?.trim() ?? '').length > 0;
    const hasJwtIssuer = (config.supabase.jwtIssuer?.trim() ?? '').length > 0;
    if (!supabaseUrl) {
      warnings.push('SUPABASE_URL is not set. JWT auth will not work until you set Supabase auth env vars.');
    } else if (!hasJwks && !hasJwtIssuer) {
      warnings.push('SUPABASE_JWKS_URL or SUPABASE_JWT_ISSUER should be set for JWT verification.');
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings
  };
}

export const QUEUE_NAME = 'batchtube-default' as const;
export const QUEUE_NAME_PROCESSING = 'batchtube-processing' as const;
