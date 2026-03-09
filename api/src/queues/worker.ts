import { Worker, type Job } from 'bullmq';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import JSZip from 'jszip';
import { prisma } from '../services/db.js';
import { detectProvider, getDefaultFormatForProvider } from '../services/providers.js';
import { putObject, getObject } from '../storage/s3.js';
import { PLAN_LIMITS, getPlan, getEntitlements, toLogicalPlan, incrementBandwidth, deductCreditsForBatch } from '../services/plans.js';
import { sendBatchWebhook } from '../services/webhooks.js';
import {
  downloadWithYtDlp,
  readDownloadAndCleanup,
  type DownloadFormat,
  type DownloadQuality
} from '../services/download.js';
import type { BatchJob, ItemJob, ProcessingJob } from './bull.js';
import { enqueueBatch, enqueueBatchItems, enqueueBatchFinalize } from './enqueue.js';
import { listSourceItems, listSourceItemsParallel, listSourceItemsPaginated } from '../services/sourceList.js';
import { config } from '../config.js';
import {
  validateRuntimeConfig,
  getDbHostCategory,
  QUEUE_NAME
} from '../runtime-config.js';
import { getYtDlpCookieExpiry } from '../services/cookieExpiry.js';
import { ensureFreshCookies } from '../services/cookieRefresh.js';
import { acquire as acquireProviderSlot, release as releaseProviderSlot } from '../services/providerConcurrency.js';
import {
  extractSourceId,
  computeDownloadCacheKey,
  findCachedFile
} from '../services/downloadCache.js';

type BatchOptions = {
  format?: string;
  quality?: string;
  archive_as_zip?: boolean;
  archive_source_url?: string;
  archive_source_type?: 'channel' | 'playlist' | 'profile';
  archive_mode?: string;
  archive_latest_n?: number;
  processing?: 'none' | 'upscale_4k';
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

export async function processItem(job: Job<ItemJob>) {
  const { batchId, itemId, userId } = job.data;

  const item = await prisma.batchItem.findFirst({
    where: { id: itemId, batch_id: batchId },
    include: { batch: true }
  });
  if (!item || !item.batch) return;
  if (item.status === 'completed' || item.status === 'failed' || item.status === 'cancelled') return;

  const provider = item.provider ?? detectProvider(item.original_url);
  await acquireProviderSlot(provider);
  try {
    const batch = item.batch;
    const batchOptions = (batch.options as BatchOptions) ?? {};
    // URL-based batches never use the processing queue; only UpScale (upload) jobs do.
    const plan = await getPlan(userId);
    const retentionHours = PLAN_LIMITS[plan].fileTtlHours;
    const entitlements = getEntitlements(plan);

    if (batch.status === 'queued') {
      await prisma.batch.update({ where: { id: batchId }, data: { status: 'processing' } });
    }

    await prisma.batchItem.update({
      where: { id: itemId },
      data: {
        status: 'processing',
        provider,
        progress: 10,
        updated_at: new Date()
      }
    });

    // Worker-side guard for disallowed options (defence in depth).
    if (batchOptions.quality === '4k' && !entitlements.canUseUpscale4k) {
      await prisma.batchItem.update({
        where: { id: itemId },
        data: {
          status: 'failed',
          error_message: 'upscale_4k_not_allowed',
          updated_at: new Date()
        }
      });
      return;
    }

    const downloadOpts = toDownloadOptions(batchOptions, provider);
    const sourceId = extractSourceId(provider, item.original_url);
    const cacheKey =
      sourceId != null
        ? computeDownloadCacheKey(provider, sourceId, downloadOpts.format, downloadOpts.quality)
        : null;

    const cached = cacheKey ? await findCachedFile(cacheKey) : null;
    if (cached) {
      const createdFile = await prisma.file.create({
        data: {
          id: randomUUID(),
          item_id: item.id,
          batch_id: batchId,
          user_id: userId,
          storage_path: cached.storage_path,
          filename: cached.filename,
          file_size_bytes: cached.file_size_bytes,
          mime_type: cached.mime_type,
          expires_at: cached.expires_at,
          cache_key: cacheKey
        }
      });

      // URL-based items: always complete here; processing queue is only for UpScale uploads.
      await prisma.batchItem.update({
        where: { id: itemId },
        data: { status: 'completed', progress: 100, updated_at: new Date() }
      });
      const terminalCount = await prisma.batchItem.count({
        where: { batch_id: batchId, status: { in: ['completed', 'failed', 'cancelled'] } }
      });
      if (terminalCount >= batch.item_count) {
        await enqueueBatchFinalize(batchId, userId, plan);
      }
      return;
    }

    try {
      const downloadOpts = toDownloadOptions(batchOptions, provider);
      const result = await downloadWithYtDlp(item.original_url, downloadOpts, item.id, provider);
      const { buffer: content } = readDownloadAndCleanup(result);

      const ext = result.ext;
      const key = `results/${batchId}/${item.id}.${ext}`;

      await putObject({ key, body: content, contentType: result.mimeType });

      const fileCacheKey =
        sourceId != null
          ? computeDownloadCacheKey(provider, sourceId, downloadOpts.format, downloadOpts.quality)
          : null;
      const createdFile = await prisma.file.create({
        data: {
          id: randomUUID(),
          item_id: item.id,
          batch_id: batchId,
          user_id: userId,
          storage_path: key,
          filename: `${item.id}.${ext}`,
          file_size_bytes: BigInt(content.byteLength),
          mime_type: result.mimeType,
          expires_at: new Date(Date.now() + retentionHours * 3600 * 1000),
          ...(fileCacheKey ? { cache_key: fileCacheKey } : {})
        }
      });

      await incrementBandwidth(userId, BigInt(content.byteLength));

      // Download + upload to storage completed. URL-based items: always complete; no processing queue.
      await prisma.batchItem.update({
        where: { id: itemId },
        data: { status: 'completed', progress: 100, updated_at: new Date() }
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const youtubeCodeMatch = errMsg.match(/^(youtube_(?:private_video|age_restricted|login_required|unavailable|extractor_error|download_error)):/);
      const errorMessageToStore = youtubeCodeMatch ? youtubeCodeMatch[1] : errMsg;
      console.error(
        JSON.stringify({ msg: 'worker_item_failed', batchId, itemId, url: item.original_url, error: errMsg })
      );
      await prisma.batchItem.update({
        where: { id: itemId },
        data: { status: 'failed', error_message: errorMessageToStore, updated_at: new Date() }
      });
    }

    const terminalCount = await prisma.batchItem.count({
      where: { batch_id: batchId, status: { in: ['completed', 'failed', 'cancelled'] } }
    });
    if (terminalCount >= batch.item_count) {
      await enqueueBatchFinalize(batchId, userId, plan);
    }
  } finally {
    releaseProviderSlot(provider);
  }
}

export async function processMedia(job: Job<ProcessingJob>) {
  const { batchId, itemId, userId } = job.data;

  const item = await prisma.batchItem.findFirst({
    where: { id: itemId, batch_id: batchId }
  });
  if (!item) return;
  if (item.status === 'completed' || item.status === 'failed' || item.status === 'cancelled') return;
  if (item.processing_mode === 'none') return;

  const plan = await getPlan(userId);
  const entitlements = getEntitlements(plan);

  if (item.processing_mode === 'upscale_4k' && !entitlements.canUseUpscale4k) {
    await prisma.batchItem.update({
      where: { id: itemId },
      data: {
        status: 'failed',
        processing_status: 'failed',
        processing_error: 'upscale_4k_not_allowed',
        updated_at: new Date()
      }
    });
    return;
  }

  try {
    await prisma.batchItem.update({
      where: { id: itemId },
      data: {
        processing_status: 'processing',
        // Processing phase: bump progress towards completion.
        progress: 80,
        updated_at: new Date()
      }
    });

    // MVP: no-op processing. Use the existing source file as output.
    const sourceFile = await prisma.file.findFirst({
      where: { batch_id: batchId, item_id: itemId },
      orderBy: { created_at: 'desc' }
    });

    if (!sourceFile) {
      await prisma.batchItem.update({
        where: { id: itemId },
        data: {
          status: 'failed',
          processing_status: 'failed',
          processing_error: 'source_file_missing',
          updated_at: new Date()
        }
      });
      return;
    }

    await prisma.batchItem.update({
      where: { id: itemId },
      data: {
        status: 'completed',
        processing_status: 'completed',
        progress: 100,
        processing_output_file_id: sourceFile.id,
        processed_at: new Date(),
        updated_at: new Date()
      }
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ msg: 'worker_processing_failed', batchId, itemId, error: errMsg }));
    await prisma.batchItem.update({
      where: { id: itemId },
      data: {
        status: 'failed',
        processing_status: 'failed',
        // Keep last known progress; don't overwrite to 0.
        processing_error: errMsg,
        updated_at: new Date()
      }
    });
  }

  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: { item_count: true }
  });
  if (!batch) return;

  const terminalCount = await prisma.batchItem.count({
    where: { batch_id: batchId, status: { in: ['completed', 'failed', 'cancelled'] } }
  });
  if (terminalCount >= batch.item_count) {
    await enqueueBatchFinalize(batchId, userId, plan);
  }
}

export async function processBatchFinalize(job: Job<BatchJob>) {
  const { batchId, userId } = job.data;

  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: { items: { where: { status: 'completed' }, include: { files: true } } }
  });
  if (!batch) return;
  if (batch.status === 'completed' || batch.status === 'partially_completed' || batch.status === 'failed') return;

  const completedCount = batch.items.length;
  const failedCount = await prisma.batchItem.count({
    where: { batch_id: batchId, status: 'failed' }
  });

  const finalStatus =
    completedCount === 0 ? 'failed' : failedCount > 0 ? 'partially_completed' : 'completed';

  let zipKey: string | null = null;
  if (completedCount > 0 && batch.items.length > 0) {
    const zip = new JSZip();
    for (const item of batch.items) {
      const outputFileId = item.processing_output_file_id;
      const file =
        (outputFileId
          ? item.files?.find((f) => f.id === outputFileId)
          : undefined) || item.files?.[0];
      if (!file?.storage_path) continue;
      try {
        const content = await getObject(file.storage_path);
        const ext = file.filename?.split('.').pop() ?? 'bin';
        zip.file(`${item.id}.${ext}`, content);
      } catch {
        // skip file if not found
      }
    }
    const fileCount = Object.keys(zip.files).length;
    if (fileCount > 0) {
      zipKey = `archives/${batchId}.zip`;
      const zipBody = await zip.generateAsync({ type: 'nodebuffer' });
      await putObject({ key: zipKey, body: zipBody, contentType: 'application/zip' });
    }
  }

  await prisma.batch.update({
    where: { id: batchId },
    data: {
      status: finalStatus,
      completed_at: new Date(),
      zip_file_path: zipKey
    }
  });

  await sendBatchWebhook({
    batchId,
    event: finalStatus === 'completed' ? 'batch.completed' : finalStatus === 'partially_completed' ? 'batch.completed' : 'batch.failed',
    status: finalStatus,
    successfulItems: completedCount,
    failedItems: failedCount
  });
}

export async function processBatch(job: Job<BatchJob>) {
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

export async function processChannelArchive(job: Job<BatchJob>) {
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

  const limit =
    mode === 'all' ? Math.min(maxItems, 500) : mode === 'latest_n' ? Math.min(latestN, maxItems) : Math.min(25, maxItems);
  let totalEnqueued = 0;
  const DISCOVERY_PAGE_SIZE = 50;

  try {
    for await (const chunk of listSourceItemsPaginated(sourceUrl, sourceType, {
      maxItems: limit,
      pageSize: DISCOVERY_PAGE_SIZE
    })) {
      if (chunk.length === 0) continue;

      try {
        await prisma.batch.update({ where: { id: batchId }, data: { status: 'queueing_items' } });
      } catch {
        return;
      }

      const provider = detectProvider(sourceUrl);
      const itemIds = chunk.map(() => randomUUID());
      await prisma.batchItem.createMany({
        data: chunk.map((item, i) => ({
          id: itemIds[i]!,
          batch_id: batchId,
          user_id: userId,
          original_url: item.url,
          provider,
          status: 'queued' as const
        }))
      });

      totalEnqueued += chunk.length;
      await prisma.batch.update({
        where: { id: batchId },
        data: { item_count: totalEnqueued, status: 'processing' }
      });

      await enqueueBatchItems(batchId, userId, itemIds, plan);
    }
  } catch (err) {
    console.error(JSON.stringify({ msg: 'channel_archive_discovery_failed', batchId, error: String(err) }));
    await prisma.batch.update({ where: { id: batchId }, data: { status: 'failed' } });
    return;
  }

  if (totalEnqueued === 0) {
    await prisma.batch.update({ where: { id: batchId }, data: { status: 'failed' } });
    return;
  }

  const creditCheck = await deductCreditsForBatch(batchId, userId, plan, totalEnqueued);
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
    await prisma.batchItem.updateMany({
      where: { batch_id: batchId },
      data: { status: 'cancelled', updated_at: new Date() }
    });
  }
}

// Fail fast: validate config before starting download worker
const validation = validateRuntimeConfig({ role: 'worker' });
if (!validation.ok) {
  console.error('[download-worker] runtime_config_validation_failed', validation.errors);
  validation.errors.forEach((m) => console.error(m));
  process.exit(1);
}
validation.warnings.forEach((m) => console.warn('[download-worker]', m));
const dbHostCategory = getDbHostCategory();
if (dbHostCategory === 'supabase_host_detected') {
  console.warn('[download-worker] DATABASE_URL points to Supabase; use Railway Postgres for worker.');
}

// Cookie refresh: when stale (by real expiry), fetch and write. Runs on startup and every 12h.
async function runCookieRefresh() {
  try {
    await ensureFreshCookies();
  } catch (e) {
    console.error('[download-worker] cookie refresh error:', e);
  }
}

runCookieRefresh();
const COOKIE_CHECK_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours
setInterval(() => runCookieRefresh(), COOKIE_CHECK_INTERVAL_MS);

// Retry connection on DNS/network errors (e.g. Railway redis.railway.internal EAI_AGAIN)
export function redisRetryStrategy(times: number): number {
  return Math.min(2000 * Math.pow(2, times), 30000);
}

new Worker<BatchJob | ItemJob>(
  QUEUE_NAME,
  async (job) => {
    if (job.name === 'process-item') return processItem(job as Job<ItemJob>);
    if (job.name === 'batch-finalize') return processBatchFinalize(job as Job<BatchJob>);
    if (job.name === 'channel-archive') return processChannelArchive(job as Job<BatchJob>);
    return processBatch(job as Job<BatchJob>);
  },
  {
    connection: {
      url: config.redisUrl,
      maxRetriesPerRequest: null,
      retryStrategy: redisRetryStrategy,
      connectTimeout: 10000
    },
    concurrency: config.workerDownloadConcurrency
  }
);

console.log(
  JSON.stringify({
    msg: 'worker_role_started',
    role: 'download-worker',
    database_provider: 'postgres',
    db_host_category: dbHostCategory,
    queue_name: QUEUE_NAME,
    concurrency: config.workerDownloadConcurrency,
    redis_configured: Boolean(config.redisUrl && config.redisUrl.length > 0),
    ...(config.ytDlpCookiesPath?.trim()
      ? (() => {
          const p = config.ytDlpCookiesPath!;
          let sizeBytes: number | null = null;
          let exists = false;
          try {
            if (fs.existsSync(p)) {
              exists = true;
              sizeBytes = fs.statSync(p).size;
            }
          } catch {
            /* ignore */
          }
          const c = exists ? getYtDlpCookieExpiry(p) : null;
          return {
            yt_dlp_cookie_configured: true,
            yt_dlp_cookie_path: p,
            yt_dlp_cookie_file_exists: exists,
            ...(sizeBytes !== null && { yt_dlp_cookie_file_bytes: sizeBytes }),
            ...(c
              ? {
                  yt_dlp_cookie_expires_in_days: c.expiresInDays,
                  yt_dlp_cookie_expired: c.isExpired
                }
              : exists
                ? { yt_dlp_cookie_expires_in_days: null }
                : { yt_dlp_cookie_hint: 'File missing – set COOKIES_INIT_URL or mount volume with cookies.txt' })
          };
        })()
      : { yt_dlp_cookie_configured: false })
  })
);
