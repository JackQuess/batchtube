import { randomUUID } from 'node:crypto';
import type { BatchStatus, ItemStatus } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { enqueueBatchItems } from '../queues/enqueue.js';
import { normalizeAndDedupeUrls } from '../services/urlIngestion.js';
import { writeAuditLog } from '../services/audit.js';
import { prisma } from '../services/db.js';
import {
  PLAN_LIMITS,
  checkCreditsAvailability,
  deductCreditsForBatchTx,
  enforceBatchLimit,
  enforceConcurrency,
  getPlan,
  getEntitlements,
  toLogicalPlan
} from '../services/plans.js';
import { detectProvider, isMediaUrlAllowed } from '../services/providers.js';
import { defaultQueue } from '../queues/bull.js';
import { signedGetUrl } from '../storage/s3.js';
import { sendError } from '../utils/errors.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const createBatchSchema = z.object({
  name: z.string().max(255).optional(),
  urls: z.array(z.string().url()).min(1),
  auto_start: z.boolean().optional().default(false),
  callback_url: z.string().url().optional(),
  options: z
    .object({
      format: z.enum(['mp4', 'mp3', 'mkv', 'jpg']).optional(),
      quality: z.enum(['best', '4k', '1080p', '720p']).optional(),
      archive_as_zip: z.boolean().optional(),
      processing: z.enum(['none', 'upscale_4k']).optional()
    })
    .optional()
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum([
    'created', 'queued', 'processing', 'completed', 'failed', 'cancelled',
    'resolving_channel', 'discovering_items', 'queueing_items', 'partially_completed'
  ]).optional()
});

const listItemsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50)
});

function toBatchResponse(batch: {
  id: string;
  name: string | null;
  status: BatchStatus;
  item_count: number;
  created_at: Date;
  items: Array<{ status: ItemStatus; progress: number }>;
}) {
  const total = batch.item_count;
  const items = batch.items;
  const completed = items.filter((i) => i.status === 'completed').length;
  const failed = items.filter((i) => i.status === 'failed').length;
  const processing = items.filter((i) => i.status === 'processing').length;
  const queued = items.filter((i) => i.status === 'queued' || i.status === 'pending').length;
  const progress =
    total === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            100,
            items.reduce((sum, item) => sum + (typeof item.progress === 'number' ? item.progress : 0), 0) /
              Math.max(total, 1)
          )
        );

  let throughput_items_per_min: number | undefined;
  let eta_seconds: number | undefined;
  if (completed > 0 && total > completed + failed) {
    const elapsedMs = Date.now() - new Date(batch.created_at).getTime();
    const elapsedMin = elapsedMs / 60000;
    if (elapsedMin > 0) {
      throughput_items_per_min = completed / elapsedMin;
      const remaining = total - completed - failed;
      if (throughput_items_per_min > 0 && remaining > 0) {
        eta_seconds = Math.round((remaining / throughput_items_per_min) * 60);
      }
    }
  }

  return {
    id: batch.id,
    name: batch.name,
    status: batch.status,
    progress,
    item_count: total,
    created_at: batch.created_at.toISOString(),
    queued,
    processing,
    completed,
    failed,
    ...(throughput_items_per_min != null && { throughput_items_per_min: Math.round(throughput_items_per_min * 10) / 10 }),
    ...(eta_seconds != null && { eta_seconds })
  };
}

const batchesRoute: FastifyPluginAsync = async (app) => {
  app.post('/v1/batches', async (request, reply) => {
    if (!request.auth) return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header.');

    const parsed = createBatchSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid request body.', {
        issues: parsed.error.issues
      });
    }

    const body = parsed.data;
    const plan = await getPlan(request.auth.user.id);
    const limits = PLAN_LIMITS[plan];
    const entitlements = getEntitlements(plan);
    const logicalPlan = toLogicalPlan(plan);
    const isAdmin = request.auth.isAdmin === true;

    const { urls: dedupedUrls, duplicatesRemoved } = normalizeAndDedupeUrls(body.urls);
    if (dedupedUrls.length === 0) {
      return sendError(request, reply, 400, 'validation_error', 'No valid URLs after normalization and deduplication.');
    }

    for (const url of dedupedUrls) {
      const validation = isMediaUrlAllowed(url);
      if (!validation.ok) {
        return sendError(request, reply, 400, 'validation_error', 'One or more URLs are not allowed.', {
          url,
          reason: validation.reason
        });
      }
    }

    const urlCount = dedupedUrls.length;
    request.log.info(
      {
        requestId: request.id,
        userId: request.auth.user.id,
        isAdmin,
        plan,
        urlCount,
        duplicatesRemoved,
        maxBatchLinks: limits.maxBatchLinks
      },
      'batch_create_start'
    );

    if (!isAdmin) {
      const batchAllowed = await enforceBatchLimit(urlCount, plan);
      request.log.info(
        { requestId: request.id, batchAllowed, urlCount, plan, maxBatchLinks: limits.maxBatchLinks },
        'batch_create_check_batch_limit'
      );
      if (!batchAllowed) {
        request.log.warn(
          { requestId: request.id, userId: request.auth.user.id, plan, maxBatchLinks: limits.maxBatchLinks, urlCount },
          'batch_create_429_batch_limit'
        );
        return sendError(request, reply, 429, 'rate_limit_exceeded', 'You have exceeded your plan limits.', {
          plan,
          max_batch_links: limits.maxBatchLinks
        });
      }
    } else {
      request.log.info({ requestId: request.id }, 'batch_create_skip_batch_limit_admin');
    }

    if (!isAdmin) {
      const concurrency = await enforceConcurrency(request.auth.user.id, plan);
      request.log.info(
        {
          requestId: request.id,
          allowed: concurrency.allowed,
          limit: concurrency.limit,
          active: concurrency.active,
          plan
        },
        'batch_create_check_concurrency'
      );
      if (!concurrency.allowed) {
        request.log.warn(
          {
            requestId: request.id,
            userId: request.auth.user.id,
            plan,
            concurrencyLimit: concurrency.limit,
            currentActive: concurrency.active
          },
          'batch_create_429_concurrency'
        );
        return sendError(request, reply, 429, 'rate_limit_exceeded', 'You have exceeded your plan limits.', {
          plan,
          concurrency: concurrency.limit,
          current_active_items: concurrency.active
        });
      }
    } else {
      request.log.info({ requestId: request.id }, 'batch_create_skip_concurrency_admin');
    }

    if (!isAdmin) {
      const creditCheck = await checkCreditsAvailability(request.auth.user.id, plan, urlCount);
      request.log.info(
        {
          requestId: request.id,
          creditCheckOk: creditCheck.ok,
          needed: creditCheck.needed,
          available: creditCheck.available,
          plan
        },
        'batch_create_check_credits'
      );
      if (!creditCheck.ok) {
        request.log.warn(
          {
            requestId: request.id,
            userId: request.auth.user.id,
            needed: creditCheck.needed,
            available: creditCheck.available,
            plan
          },
          'batch_create_402_insufficient_credits'
        );
        return sendError(request, reply, 402, 'insufficient_credits', 'Not enough credits to start this batch.', {
          needed: creditCheck.needed,
          available: creditCheck.available,
          plan
        });
      }
    } else {
      request.log.info({ requestId: request.id }, 'batch_create_skip_credits_admin');
    }

    // --- 503 sources (POST /v1/batches):
    // 1. Queue health check (getWaitingCount/getDelayedCount) throws → Redis unreachable → 503 service_unavailable, reason: redis_unavailable
    // 2. prisma.$transaction throws PrismaClientInitializationError or P1001/P1017 → DB unreachable → 503 service_unavailable, reason: database_unavailable
    // 3. enqueueBatch() throws after transaction committed → 503 service_unavailable, reason: queue_unavailable (batch_id returned so client can retry)
    // ---
    // Queue overload guard: if Redis is unreachable, return 503 with reason; otherwise enforce limit
    let queueSize = 0;
    try {
      const [waitingCount, delayedCount] = await Promise.all([
        defaultQueue.getWaitingCount(),
        defaultQueue.getDelayedCount()
      ]);
      queueSize = waitingCount + delayedCount;
      request.log.info(
        { requestId: request.id, queueWaiting: waitingCount, queueDelayed: delayedCount, queueSize, isAdmin },
        'batch_create_queue_health'
      );
      if (queueSize > 5000 && !isAdmin) {
        request.log.warn(
          { requestId: request.id, userId: request.auth.user.id, queueSize, threshold: 5000 },
          'batch_create_429_queue_full'
        );
        return sendError(request, reply, 429, 'system_busy', 'System busy. Please retry shortly.', {
          queue_size: queueSize
        });
      }
    } catch (queueError) {
      request.log.warn(
        {
          requestId: request.id,
          root_cause: 'redis_unavailable',
          message: 'Queue health check failed: Redis unreachable or connection refused'
        },
        'batch_create_503_redis_unavailable'
      );
      return sendError(request, reply, 503, 'service_unavailable', 'Queue temporarily unavailable. Please retry.', {
        reason: 'redis_unavailable'
      });
    }

    const autoStart = body.auto_start ?? false;

    // Load default webhook URL for this user (used when callback_url not explicitly provided)
    const userRow = await prisma.user.findUnique({
      where: { id: request.auth.user.id },
      select: { webhook_url: true }
    });
    const defaultWebhookUrl = userRow?.webhook_url ?? null;
    const effectiveCallbackUrl = body.callback_url ?? defaultWebhookUrl;

    // Feature gating: automation/webhooks and quality caps
    if (effectiveCallbackUrl && !entitlements.canUseAutomation && !isAdmin) {
      return sendError(
        request,
        reply,
        403,
        'automation_not_allowed',
        'Webhooks and automation are only available on Ultra plan.',
        { plan: logicalPlan }
      );
    }

    if (body.options?.quality === '4k' && !entitlements.canUseUpscale4k && !isAdmin) {
      return sendError(
        request,
        reply,
        403,
        'upscale_4k_not_allowed',
        '4K quality is only available on Ultra plan.',
        { plan: logicalPlan }
      );
    }

    request.log.info({ requestId: request.id, isAdmin, plan }, 'batch_create_checks_passed_proceeding_to_tx');

    const batchId = randomUUID();
    const itemIds = dedupedUrls.map(() => randomUUID());
    let batch: Awaited<ReturnType<typeof prisma.batch.create>>;
    try {
      batch = await prisma.$transaction(async (tx) => {
        const createdBatch = await tx.batch.create({
          data: {
            id: batchId,
            user_id: request.auth!.user.id,
            name: body.name ?? null,
            status: autoStart ? 'processing' : 'created',
            options: {
              format: body.options?.format ?? 'mp4',
              quality: body.options?.quality ?? 'best',
              archive_as_zip: body.options?.archive_as_zip ?? false,
              processing: 'none'
            },
            callback_url: effectiveCallbackUrl,
            item_count: urlCount
          }
        });

        await tx.batchItem.createMany({
          data: dedupedUrls.map((url, i) => ({
            id: itemIds[i]!,
            batch_id: createdBatch.id,
            user_id: request.auth!.user.id,
            original_url: url,
            provider: detectProvider(url),
            status: autoStart ? 'queued' : 'pending'
          }))
        });

        if (!isAdmin) {
          const creditDeduction = await deductCreditsForBatchTx(
            tx,
            request.auth!.user.id,
            plan,
            urlCount
          );
          if (!creditDeduction.ok) {
            throw new Error(`INSUFFICIENT_CREDITS:${creditDeduction.needed}:${creditDeduction.available}`);
          }
          await tx.creditLedger.create({
            data: {
              user_id: request.auth!.user.id,
              amount: creditDeduction.needed,
              reason: 'batch_start',
              batch_id: createdBatch.id
            }
          });
        }

        return createdBatch;
      });
    request.log.info(
      { requestId: request.id, batchId: batch.id, userId: request.auth!.user.id, isAdmin },
      'batch_create_tx_ok'
    );
    } catch (error: unknown) {
      if (error instanceof Error && error.message.startsWith('INSUFFICIENT_CREDITS:')) {
        const [, neededRaw, availableRaw] = error.message.split(':');
        return sendError(request, reply, 402, 'insufficient_credits', 'Not enough credits to start this batch.', {
          needed: Number(neededRaw),
          available: Number(availableRaw),
          plan
        });
      }
      const prismaError = error as { code?: string; name?: string; message?: string };
      if (prismaError?.code === 'P2003') {
        return sendError(request, reply, 409, 'conflict', 'Batch creation failed due to a constraint. Please retry.');
      }
      if (
        prismaError?.name === 'PrismaClientInitializationError' ||
        prismaError?.code === 'P1001' ||
        prismaError?.code === 'P1017'
      ) {
        request.log.error(
          {
            requestId: request.id,
            root_cause: 'database_unavailable',
            code: prismaError?.code,
            name: prismaError?.name,
            message: 'Prisma cannot reach database server. Set DATABASE_URL to Railway Postgres for API runtime.'
          },
          'batch_create_503_database_unavailable'
        );
        return sendError(request, reply, 503, 'service_unavailable', 'Database temporarily unavailable. Please retry.', {
          reason: 'database_unavailable'
        });
      }
      throw error;
    }

    if (autoStart) {
      try {
        const planForEnqueue = isAdmin ? 'enterprise' : plan;
        await enqueueBatchItems(batch.id, request.auth.user.id, itemIds, planForEnqueue);
        request.log.debug({ batchId: batch.id, itemCount: itemIds.length, isAdmin }, 'enqueue_batch_items_ok');
      } catch (enqueueError) {
        request.log.error(
          {
            requestId: request.id,
            batchId: batch.id,
            root_cause: 'queue_unavailable',
            message: 'Batch created in DB but enqueue to Redis failed. Check REDIS_URL and that worker is running.'
          },
          'batch_create_503_enqueue_failed'
        );
        return sendError(request, reply, 503, 'service_unavailable', 'Batch created but queue unavailable. Please retry or use the batch later.', {
          reason: 'queue_unavailable',
          batch_id: batch.id
        });
      }
    }

    await writeAuditLog({
      request,
      userId: request.auth.user.id,
      action: 'batches.create',
      resourceId: batch.id
    });

    request.log.info({ requestId: request.id, batchId: batch.id, isAdmin }, 'batch_create_201_success');
    const initialQueued = autoStart ? batch.item_count : 0;
    return reply.status(201).send({
      id: batch.id,
      name: batch.name,
      status: batch.status,
      progress: 0,
      item_count: batch.item_count,
      created_at: batch.created_at.toISOString(),
      queued: initialQueued,
      processing: 0,
      completed: 0,
      failed: 0
    });
  });

  app.get('/v1/batches', async (request, reply) => {
    if (!request.auth) return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header.');

    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid query parameters.', {
        issues: parsed.error.issues
      });
    }

    const { page, limit, status } = parsed.data;

    const where = {
      user_id: request.auth.user.id,
      ...(status ? { status } : {})
    };

    const [rows, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: {
            select: { status: true, progress: true }
          }
        }
      }),
      prisma.batch.count({ where })
    ]);

    return reply.send({
      data: rows.map((row) => toBatchResponse(row)),
      meta: {
        page,
        limit,
        total
      }
    });
  });

  app.get('/v1/batches/:id', async (request, reply) => {
    if (!request.auth) return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header.');

    const { id } = request.params as { id: string };
    if (!UUID_RE.test(id)) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid batch id.', { id });
    }

    const batch = await prisma.batch.findFirst({
      where: {
        id,
        user_id: request.auth.user.id
      },
      include: {
        items: {
          select: { status: true, progress: true }
        }
      }
    });

    if (!batch) {
      return sendError(request, reply, 404, 'not_found', 'Batch not found.', { id });
    }

    return reply.send(toBatchResponse(batch));
  });

  app.post('/v1/batches/:id/cancel', async (request, reply) => {
    if (!request.auth) return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header.');

    const { id } = request.params as { id: string };
    if (!UUID_RE.test(id)) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid batch id.', { id });
    }

    const batch = await prisma.batch.findFirst({
      where: {
        id,
        user_id: request.auth.user.id
      }
    });

    if (!batch) {
      return sendError(request, reply, 404, 'not_found', 'Batch not found.', { id });
    }

    await prisma.batch.update({
      where: { id },
      data: {
        status: 'cancelled',
        completed_at: new Date()
      }
    });

    await prisma.batchItem.updateMany({
      where: {
        batch_id: id,
        status: { in: ['pending', 'queued', 'processing'] }
      },
      data: {
        status: 'cancelled',
        updated_at: new Date()
      }
    });

    const updated = await prisma.batch.findUnique({
      where: { id },
      include: { items: { select: { status: true, progress: true } } }
    });

    await writeAuditLog({
      request,
      userId: request.auth.user.id,
      action: 'batches.cancel',
      resourceId: id
    });

    return reply.send(toBatchResponse(updated!));
  });

  app.get('/v1/batches/:id/items', async (request, reply) => {
    if (!request.auth) return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header.');

    const { id } = request.params as { id: string };
    if (!UUID_RE.test(id)) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid batch id.', { id });
    }

    const parsed = listItemsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid query parameters.', {
        issues: parsed.error.issues
      });
    }

    const { page, limit } = parsed.data;

    const batch = await prisma.batch.findFirst({
      where: {
        id,
        user_id: request.auth.user.id
      }
    });

    if (!batch) {
      return sendError(request, reply, 404, 'not_found', 'Batch not found.', { id });
    }

    const [items, total] = await Promise.all([
      prisma.batchItem.findMany({
        where: { batch_id: id },
        orderBy: { created_at: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.batchItem.count({ where: { batch_id: id } })
    ]);

    const files = await prisma.file.findMany({
      where: {
        batch_id: id,
        item_id: {
          in: items.map((item) => item.id)
        }
      },
      select: {
        id: true,
        item_id: true
      }
    });

    const fileMap = new Map(files.map((file) => [file.item_id, file.id]));

    return reply.send({
      data: items.map((item) => ({
        id: item.id,
        original_url: item.original_url,
        provider: item.provider ?? 'generic',
        status: item.status,
        file_id: fileMap.get(item.id) ?? null,
        error: item.error_message ?? null
      })),
      meta: {
        page,
        total
      }
    });
  });

  app.get('/v1/batches/:id/zip', async (request, reply) => {
    if (!request.auth) return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header.');

    const { id } = request.params as { id: string };
    if (!UUID_RE.test(id)) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid batch id.', { id });
    }

    const batch = await prisma.batch.findFirst({
      where: {
        id,
        user_id: request.auth.user.id
      }
    });

    if (!batch) {
      return sendError(request, reply, 404, 'not_found', 'Batch not found.', { id });
    }

    if (batch.status !== 'completed' && batch.status !== 'partially_completed' || !batch.zip_file_path) {
      return sendError(request, reply, 403, 'forbidden', 'Batch ZIP is not available.', {
        status: batch.status
      });
    }

    const expiresInSeconds = 3600;
    const url = await signedGetUrl(batch.zip_file_path, expiresInSeconds);
    const expires_at = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    await writeAuditLog({
      request,
      userId: request.auth.user.id,
      action: 'batches.zip_link',
      resourceId: id
    });

    return reply.send({ url, expires_at });
  });
};

export default batchesRoute;
