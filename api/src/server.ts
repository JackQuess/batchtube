import { createApp } from './app.js';
import { config } from './config.js';
import { ensureBucket } from './storage/s3.js';
import {
  getDbHostCategory,
  validateRuntimeConfig,
  QUEUE_NAME
} from './runtime-config.js';
import { defaultQueue } from './queues/bull.js';

const app = createApp();

async function runStartupDiagnostics(): Promise<void> {
  const validation = validateRuntimeConfig();
  if (!validation.ok) {
    app.log.error(
      { errors: validation.errors, warnings: validation.warnings },
      'runtime_config_validation_failed'
    );
    validation.errors.forEach((msg) => app.log.error(msg));
    process.exit(1);
  }
  validation.warnings.forEach((msg) => app.log.warn(msg));

  const dbHostCategory = getDbHostCategory();
  if (dbHostCategory === 'supabase_host_detected') {
    app.log.warn(
      { db_host_category: dbHostCategory },
      'runtime_db_supabase_detected_use_railway_postgres_for_api_worker'
    );
  }

  let redisStatus: 'ok' | 'failed' = 'failed';
  try {
    await defaultQueue.getWaitingCount();
    redisStatus = 'ok';
  } catch (err) {
    app.log.warn({ err }, 'startup_redis_check_failed');
  }

  app.log.info(
    {
      database_provider: 'postgres',
      db_host_category: dbHostCategory,
      redis_status: redisStatus,
      queue_name: QUEUE_NAME,
      supabase_auth: {
        has_url: Boolean(config.supabase?.url?.trim()),
        has_jwks_url: Boolean(config.supabase?.jwksUrl?.trim()),
        has_jwt_issuer: Boolean(config.supabase?.jwtIssuer?.trim())
      }
    },
    'startup_diagnostics'
  );
}

async function start() {
  await runStartupDiagnostics();

  try {
    await ensureBucket();
  } catch (error) {
    app.log.error({ err: error }, 's3_bucket_ensure_failed_starting_without_bucket_check');
  }
  await app.listen({
    host: '0.0.0.0',
    port: config.port
  });
}

start()
  .then(() => {
    app.log.info({ port: config.port }, 'batchtube_api_started');
  })
  .catch((error) => {
    app.log.error({ err: error }, 'batchtube_api_start_failed');
    process.exit(1);
  });
