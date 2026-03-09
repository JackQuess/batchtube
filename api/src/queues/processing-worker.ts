import { Worker, type Job } from 'bullmq';
import { config } from '../config.js';
import {
  validateRuntimeConfig,
  getDbHostCategory,
  QUEUE_NAME_PROCESSING
} from '../runtime-config.js';
import type { ProcessingJob } from './bull.js';
import { processMedia, redisRetryStrategy } from './worker.js';

// Fail fast: validate config before starting processing worker
const validation = validateRuntimeConfig({ role: 'worker' });
if (!validation.ok) {
  console.error('[processing-worker] runtime_config_validation_failed', validation.errors);
  validation.errors.forEach((m) => console.error(m));
  process.exit(1);
}
validation.warnings.forEach((m) => console.warn('[processing-worker]', m));
const dbHostCategory = getDbHostCategory();
if (dbHostCategory === 'supabase_host_detected') {
  console.warn('[processing-worker] DATABASE_URL points to Supabase; use Railway Postgres for worker.');
}

new Worker<ProcessingJob>(
  QUEUE_NAME_PROCESSING,
  async (job) => {
    return processMedia(job as Job<ProcessingJob>);
  },
  {
    connection: {
      url: config.redisUrl,
      maxRetriesPerRequest: null,
      retryStrategy: redisRetryStrategy,
      connectTimeout: 10000
    },
    concurrency: config.workerProcessingConcurrency
  }
);

console.log(
  JSON.stringify({
    msg: 'worker_role_started',
    role: 'processing-worker',
    database_provider: 'postgres',
    db_host_category: dbHostCategory,
    queue_name: QUEUE_NAME_PROCESSING,
    concurrency: config.workerProcessingConcurrency,
    redis_configured: Boolean(config.redisUrl && config.redisUrl.length > 0)
  })
);

