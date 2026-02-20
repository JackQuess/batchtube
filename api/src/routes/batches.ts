import { randomUUID } from 'node:crypto';
import type { BatchStatus, ItemStatus } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { enqueueBatch } from '../queues/enqueue.js';
import { writeAuditLog } from '../services/audit.js';
import { prisma } from '../services/db.js';
import {
  PLAN_LIMITS,
  enforceBatchLimit,
  enforceConcurrency,
  enforceMonthlyQuota,
  getPlan,
  incrementUsage
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
  options: z.object({
    format: z.enum(['mp4', 'mp3', 'mkv']).optional(),
    quality: z.enum(['best', '4k', '1080p', '720p']).optional(),
    archive_as_zip: z.boolean().optional()
  }).optional()
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['created', 'queued', 'processing', 'completed', 'failed', 'cancelled']).optional()
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
  items: Array<{ status: ItemStatus }>;
}) {
  const total = batch.item_count;
  const completed = batch.items.filter((item) => item.status === 'completed').length;
  const progress = total === 0 ? 0 : (completed / total) * 100;

  return {
    id: batch.id,
    name: batch.name,
    status: batch.status,
    progress,
    item_count: total,
    created_at: batch.created_at.toISOString()
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
    const batchAllowed = await enforceBatchLimit(body.urls.length, plan);
    if (!batchAllowed) {
      return sendError(request, reply, 429, 'rate_limit_exceeded', 'You have exceeded your plan limits.', {
        plan,
        max_batch_links: limits.maxBatchLinks
      });
    }

    for (const url of body.urls) {
      const validation = isMediaUrlAllowed(url);
      if (!validation.ok) {
        return sendError(request, reply, 400, 'validation_error', 'One or more URLs are not allowed.', {
          url,
          reason: validation.reason
        });
      }
    }

    const concurrency = await enforceConcurrency(request.auth.user.id, plan);
    if (!concurrency.allowed) {
      return sendError(request, reply, 429, 'rate_limit_exceeded', 'You have exceeded your plan limits.', {
        plan,
        concurrency: concurrency.limit,
        current_active_items: concurrency.active
      });
    }

    const monthly = await enforceMonthlyQuota(request.auth.user.id, plan);
    if (!monthly.allowed) {
      return sendError(request, reply, 429, 'rate_limit_exceeded', 'You have exceeded your plan limits.', {
        plan,
        monthly_batches_limit: monthly.limit,
        monthly_batches_used: monthly.used
      });
    }

    const waitingCount = await defaultQueue.getWaitingCount();
    const delayedCount = await defaultQueue.getDelayedCount();
    if (waitingCount + delayedCount > 5000) {
      return sendError(request, reply, 429, 'system_busy', 'System busy. Please retry shortly.', {
        queue_size: waitingCount + delayedCount
      });
    }

    const autoStart = body.auto_start ?? false;

    const batch = await prisma.batch.create({
      data: {
        id: randomUUID(),
        user_id: request.auth.user.id,
        name: body.name ?? null,
        status: autoStart ? 'queued' : 'created',
        options: {
          format: body.options?.format ?? 'mp4',
          quality: body.options?.quality ?? 'best',
          archive_as_zip: body.options?.archive_as_zip ?? false
        },
        callback_url: body.callback_url ?? null,
        item_count: body.urls.length
      }
    });

    await prisma.batchItem.createMany({
      data: body.urls.map((url) => ({
        id: randomUUID(),
        batch_id: batch.id,
        user_id: request.auth!.user.id,
        original_url: url,
        provider: detectProvider(url),
        status: autoStart ? 'queued' : 'pending'
      }))
    });

    await incrementUsage(request.auth.user.id, 1);

    if (autoStart) {
      await enqueueBatch(batch.id, request.auth.user.id, plan);
    }

    await writeAuditLog({
      request,
      userId: request.auth.user.id,
      action: 'batches.create',
      resourceId: batch.id
    });

    return reply.status(201).send({
      id: batch.id,
      name: batch.name,
      status: batch.status,
      progress: 0,
      item_count: batch.item_count,
      created_at: batch.created_at.toISOString()
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
            select: { status: true }
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
          select: { status: true }
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
      include: { items: { select: { status: true } } }
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

    const archiveEnabled = Boolean((batch.options as { archive_as_zip?: boolean } | null)?.archive_as_zip);
    if (!archiveEnabled || batch.status !== 'completed' || !batch.zip_file_path) {
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
