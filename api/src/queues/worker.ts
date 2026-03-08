import { Worker, type Job } from 'bullmq';
import { randomUUID } from 'node:crypto';
import JSZip from 'jszip';
import { prisma } from '../services/db.js';
import { detectProvider, getDefaultFormatForProvider } from '../services/providers.js';
import { putObject } from '../storage/s3.js';
import { PLAN_LIMITS, getPlan, incrementBandwidth, deductCreditsForBatch } from '../services/plans.js';
import { sendBatchWebhook } from '../services/webhooks.js';
import {
  downloadWithYtDlp,
  readDownloadAndCleanup,
  type DownloadFormat,
  type DownloadQuality
} from '../services/download.js';
import type { BatchJob } from './bull.js';
import { enqueueBatch } from './enqueue.js';
import { listSourceItems, listSourceItemsParallel } from '../services/sourceList.js';
import { config } from '../config.js';
import {
  validateRuntimeConfig,
  getDbHostCategory,
  QUEUE_NAME
} from '../runtime-config.js';
import { getYtDlpCookieExpiry } from '../services/cookieExpiry.js';
import { ensureFreshCookies } from '../services/cookieRefresh.js';

type BatchOptions = {
  format?: string;
  quality?: string;
  archive_as_zip?: boolean;
  archive_source_url?: string;
  archive_source_type?: 'channel' | 'playlist' | 'profile';
  archive_mode?: string;
  archive_latest_n?: number;
};

const ALLOWED_FORMATS: DownloadFormat[] = ['mp4', 'mp3', 'mkv'];

function toDownloadOptions(
  opts: BatchOptions | null,
  provider: string
): { format: DownloadFormat; quality: DownloadQuality } {
  const quality = (opts?.quality === '4k' || opts?.quality === '1080p' || opts?.quality === '720p' ? opts.quality : 'best') as DownloadQuality;
  const requestedFormat = opts?.format;
  const format: DownloadFormat =
    requestedFormat && ALLOWED_FORMATS.includes(requestedFormat as DownloadFormat)
      ? (requestedFormat as DownloadFormat)
      : getDefaultFormatForProvider(provider);
  return { format, quality };
}

async function processBatch(job: Job<BatchJob>) {
  const { batchId, userId } = job.data;

  const plan = await getPlan(userId);
  const retentionHours = PLAN_LIMITS[plan].fileTtlHours;

  const batch = await prisma.batch.findUniqueOrThrow({ where: { id: batchId } });
  const batchOptions = (batch.options as BatchOptions) ?? {};
  await prisma.batch.update({ where: { id: batchId }, data: { status: 'processing' } });

  const items = await prisma.batchItem.findMany({
    where: { batch_id: batchId },
    orderBy: { created_at: 'asc' }
  });

  let completed = 0;
  let failed = 0;
  const completedFiles: { id: string; content: Buffer; ext: string }[] = [];

  for (const item of items) {
    try {
      const provider = item.provider ?? detectProvider(item.original_url);
      await prisma.batchItem.update({
        where: { id: item.id },
        data: {
          status: 'processing',
          provider,
          progress: 25,
          updated_at: new Date()
        }
      });

      const downloadOpts = toDownloadOptions(batchOptions, provider);
      const result = await downloadWithYtDlp(item.original_url, downloadOpts, item.id, provider);
      const { buffer: content } = readDownloadAndCleanup(result);

      const ext = result.ext;
      const key = `results/${batchId}/${item.id}.${ext}`;

      if (provider === 'youtube') {
        console.log(
          JSON.stringify({
            msg: 'youtube_upload_start',
            itemId: item.id,
            batchId,
            key
          })
        );
      }
      await putObject({
        key,
        body: content,
        contentType: result.mimeType
      });
      if (provider === 'youtube') {
        console.log(
          JSON.stringify({
            msg: 'youtube_upload_success',
            itemId: item.id,
            batchId,
            key
          })
        );
      }

      await prisma.file.create({
        data: {
          id: randomUUID(),
          item_id: item.id,
          batch_id: batchId,
          user_id: userId,
          storage_path: key,
          filename: `${item.id}.${ext}`,
          file_size_bytes: BigInt(content.byteLength),
          mime_type: result.mimeType,
          expires_at: new Date(Date.now() + retentionHours * 3600 * 1000)
        }
      });

      await prisma.batchItem.update({
        where: { id: item.id },
        data: { status: 'completed', progress: 100, updated_at: new Date() }
      });

      await incrementBandwidth(userId, BigInt(content.byteLength));
      completed += 1;
      completedFiles.push({ id: item.id, content, ext });
    } catch (error) {
      failed += 1;
      const errMsg = error instanceof Error ? error.message : String(error);
      const errName = error instanceof Error ? error.name : 'Error';
      const youtubeCodeMatch = errMsg.match(/^(youtube_(?:private_video|age_restricted|login_required|unavailable|extractor_error|download_error)):/);
      const errorMessageToStore = youtubeCodeMatch ? youtubeCodeMatch[1] : errMsg;
      console.error(
        JSON.stringify({
          msg: 'worker_item_failed',
          batchId,
          itemId: item.id,
          url: item.original_url,
          error: errMsg,
          errorName: errName,
          ...(youtubeCodeMatch ? { youtubeErrorCode: youtubeCodeMatch[1] } : {})
        })
      );
      await prisma.batchItem.update({
        where: { id: item.id },
        data: {
          status: 'failed',
          error_message: errorMessageToStore,
          updated_at: new Date()
        }
      });
    }

    // Progress is computed on read from item states; not persisted in DB schema.
  }

  const finalStatus = completed > 0 ? 'completed' : 'failed';
  const zipKey = `archives/${batchId}.zip`;

  if (completed > 0 && completedFiles.length > 0) {
    const zip = new JSZip();
    for (const { id, content, ext } of completedFiles) {
      zip.file(`${id}.${ext}`, content);
    }
    const zipBody = await zip.generateAsync({ type: 'nodebuffer' });
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

async function processChannelArchive(job: Job<BatchJob>) {
  const { batchId, userId } = job.data;

  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch || batch.status !== 'resolving_channel') {
    return;
  }

  const opts = (batch.options || {}) as BatchOptions;
  const sourceUrl = opts.archive_source_url;
  const sourceType = opts.archive_source_type || 'channel';
  const mode = opts.archive_mode || 'latest_25';
  const latestN = opts.archive_latest_n ?? 25;

  if (!sourceUrl) {
    await prisma.batch.update({ where: { id: batchId }, data: { status: 'failed' } });
    return;
  }

  const plan = await getPlan(userId);
  const maxItems = PLAN_LIMITS[plan].maxBatchLinks;

  try {
    await prisma.batch.update({ where: { id: batchId }, data: { status: 'discovering_items' } });
  } catch {
    return;
  }

  let itemUrls: string[];
  try {
    if (mode === 'all') {
      const items = await listSourceItemsParallel(sourceUrl, sourceType, Math.min(maxItems, 500));
      itemUrls = items.map((i) => i.url);
    } else {
      const limit = mode === 'latest_n' ? Math.min(latestN, maxItems) : Math.min(25, maxItems);
      const result = await listSourceItems(sourceUrl, sourceType, { page: 1, limit });
      itemUrls = result.data.slice(0, limit).map((i) => i.url);
    }
  } catch (err) {
    console.error(JSON.stringify({ msg: 'channel_archive_discovery_failed', batchId, error: String(err) }));
    await prisma.batch.update({ where: { id: batchId }, data: { status: 'failed' } });
    return;
  }

  if (itemUrls.length === 0) {
    await prisma.batch.update({ where: { id: batchId }, data: { status: 'failed' } });
    return;
  }

  try {
    await prisma.batch.update({ where: { id: batchId }, data: { status: 'queueing_items' } });
  } catch {
    return;
  }

  const creditCheck = await deductCreditsForBatch(batchId, userId, plan, itemUrls.length);
  if (!creditCheck.ok) {
    console.error(
      JSON.stringify({
        msg: 'channel_archive_insufficient_credits',
        batchId,
        needed: creditCheck.needed,
        available: creditCheck.available
      })
    );
    await prisma.batch.update({ where: { id: batchId }, data: { status: 'failed' } });
    return;
  }

  const provider = detectProvider(sourceUrl);
  await prisma.batchItem.createMany({
    data: itemUrls.map((url) => ({
      id: randomUUID(),
      batch_id: batchId,
      user_id: userId,
      original_url: url,
      provider,
      status: 'queued' as const
    }))
  });

  await prisma.batch.update({
    where: { id: batchId },
    data: { status: 'queued', item_count: itemUrls.length }
  });

  await enqueueBatch(batchId, userId, plan);
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

// Cookie refresh: when stale (by real expiry), fetch and write. Runs on startup and every 12h.
async function runCookieRefresh() {
  try {
    await ensureFreshCookies();
  } catch (e) {
    console.error('[worker] cookie refresh error:', e);
  }
}

runCookieRefresh();
const COOKIE_CHECK_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours
setInterval(() => runCookieRefresh(), COOKIE_CHECK_INTERVAL_MS);

// Retry connection on DNS/network errors (e.g. Railway redis.railway.internal EAI_AGAIN)
function redisRetryStrategy(times: number): number {
  return Math.min(2000 * Math.pow(2, times), 30000);
}

new Worker<BatchJob>(
  QUEUE_NAME,
  async (job) => {
    if (job.name === 'channel-archive') return processChannelArchive(job);
    return processBatch(job);
  },
  {
  connection: {
    url: config.redisUrl,
    maxRetriesPerRequest: null,
    retryStrategy: redisRetryStrategy,
    connectTimeout: 10000
  },
  concurrency: 20
});

console.log(
  JSON.stringify({
    msg: 'worker_started',
    database_provider: 'postgres',
    db_host_category: dbHostCategory,
    queue_name: QUEUE_NAME,
    redis_configured: Boolean(config.redisUrl && config.redisUrl.length > 0),
    ...(config.ytDlpCookiesPath?.trim()
      ? (() => {
          const c = getYtDlpCookieExpiry(config.ytDlpCookiesPath!);
          return c
            ? {
                yt_dlp_cookie_configured: true,
                yt_dlp_cookie_expires_in_days: c.expiresInDays,
                yt_dlp_cookie_expired: c.isExpired
              }
            : { yt_dlp_cookie_configured: true, yt_dlp_cookie_expires_in_days: null };
        })()
      : { yt_dlp_cookie_configured: false })
  })
);
