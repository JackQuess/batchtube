import { Worker, type Job } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { prisma } from '../services/db.js';
import { detectProvider } from '../services/providers.js';
import { putObject } from '../storage/s3.js';
import { PLAN_LIMITS, getPlan, incrementBandwidth } from '../services/plans.js';
import { sendBatchWebhook } from '../services/webhooks.js';
import type { BatchJob } from './bull.js';
import { config } from '../config.js';
import {
  validateRuntimeConfig,
  getDbHostCategory,
  QUEUE_NAME
} from '../runtime-config.js';

async function processBatch(job: Job<BatchJob>) {
  const { batchId, userId } = job.data;

  const plan = await getPlan(userId);
  const retentionHours = PLAN_LIMITS[plan].fileTtlHours;

  await prisma.batch.update({ where: { id: batchId }, data: { status: 'processing' } });

  const items = await prisma.batchItem.findMany({
    where: { batch_id: batchId },
    orderBy: { created_at: 'asc' }
  });

  let completed = 0;
  let failed = 0;

  for (const item of items) {
    try {
      await prisma.batchItem.update({
        where: { id: item.id },
        data: {
          status: 'processing',
          provider: item.provider ?? detectProvider(item.original_url),
          progress: 25,
          updated_at: new Date()
        }
      });

      const provider = item.provider ?? detectProvider(item.original_url);
      const content = Buffer.from(`source=${item.original_url}\nprovider=${provider}\n`);
      const key = `results/${batchId}/${item.id}.txt`;

      await putObject({
        key,
        body: content,
        contentType: 'text/plain'
      });

      await prisma.file.create({
        data: {
          id: randomUUID(),
          item_id: item.id,
          batch_id: batchId,
          user_id: userId,
          storage_path: key,
          filename: `${item.id}.txt`,
          file_size_bytes: BigInt(content.byteLength),
          mime_type: 'text/plain',
          expires_at: new Date(Date.now() + retentionHours * 3600 * 1000)
        }
      });

      await prisma.batchItem.update({
        where: { id: item.id },
        data: { status: 'completed', progress: 100, updated_at: new Date() }
      });

      await incrementBandwidth(userId, BigInt(content.byteLength));
      completed += 1;
    } catch (error) {
      failed += 1;
      await prisma.batchItem.update({
        where: { id: item.id },
        data: {
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Processing failed',
          updated_at: new Date()
        }
      });
    }

    // Progress is computed on read from item states; not persisted in DB schema.
  }

  const finalStatus = completed > 0 ? 'completed' : 'failed';
  const zipKey = `archives/${batchId}.zip`;

  if (completed > 0) {
    const zipBody = Buffer.from(`batch=${batchId}\ncompleted=${completed}\nfailed=${failed}\n`);
    await putObject({ key: zipKey, body: zipBody, contentType: 'application/zip' });
  }

  await prisma.batch.update({
    where: { id: batchId },
    data: {
      status: finalStatus,
      completed_at: new Date(),
      zip_file_path: completed > 0 ? zipKey : null
    }
  });

  await sendBatchWebhook({
    batchId,
    event: finalStatus === 'completed' ? 'batch.completed' : 'batch.failed',
    status: finalStatus,
    successfulItems: completed,
    failedItems: failed
  });
}

// Fail fast: validate config before starting worker
const validation = validateRuntimeConfig({ role: 'worker' });
if (!validation.ok) {
  console.error('[worker] runtime_config_validation_failed', validation.errors);
  validation.errors.forEach((m) => console.error(m));
  process.exit(1);
}
validation.warnings.forEach((m) => console.warn('[worker]', m));
const dbHostCategory = getDbHostCategory();
if (dbHostCategory === 'supabase_host_detected') {
  console.warn('[worker] DATABASE_URL points to Supabase; use Railway Postgres for worker.');
}

new Worker<BatchJob>(QUEUE_NAME, processBatch, { connection: { url: config.redisUrl }, concurrency: 20 });

console.log(
  JSON.stringify({
    msg: 'worker_started',
    database_provider: 'postgres',
    db_host_category: dbHostCategory,
    queue_name: QUEUE_NAME,
    redis_configured: Boolean(config.redisUrl && config.redisUrl.length > 0)
  })
);
