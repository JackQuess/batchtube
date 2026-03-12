import { randomUUID } from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/db.js';
import {
  PLAN_LIMITS,
  checkCreditsAvailability,
  deductCreditsForBatchTx,
  getPlan,
  getEntitlements,
  toLogicalPlan
} from '../services/plans.js';
import { enqueueProcessingJob, enqueueBatchFinalize } from '../queues/enqueue.js';
import { signedPutUrl } from '../storage/s3.js';
import { sendError } from '../utils/errors.js';

const processingModeSchema = z.enum(['none', 'upscale_4k', 'resolution_convert', 'format_convert']);

const createUpScaleJobSchema = z.object({
  name: z.string().max(255).optional(),
  options: z.object({
    processing_mode: processingModeSchema.default('upscale_4k'),
    target_resolution: z.enum(['720p', '1080p', '1440p', '4k']).default('4k'),
    target_format: z.enum(['mp4', 'mkv', 'mov', 'webm']).default('mp4'),
    archive_as_zip: z.boolean().optional().default(true),
    callback_url: z.string().url().optional()
  }),
  files: z
    .array(
      z.object({
        filename: z.string().max(255),
        content_type: z.string().max(100).optional(),
        size_bytes: z.number().int().nonnegative().optional()
      })
    )
    .min(1)
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const upscaleRoute: FastifyPluginAsync = async (app) => {
  app.post('/v1/upscale/jobs', async (request, reply) => {
    if (!request.auth) {
      return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header.');
    }

    const parsed = createUpScaleJobSchema.safeParse(request.body);
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

    if (!entitlements.canUseAdvancedProcessing && !isAdmin) {
      return sendError(
        request,
        reply,
        403,
        'advanced_processing_not_allowed',
        'UpScale workspace is not available on your plan.',
        { plan: logicalPlan }
      );
    }

    if (
      (body.options.processing_mode === 'upscale_4k' || body.options.target_resolution === '4k') &&
      !entitlements.canUseUpscale4k &&
      !isAdmin
    ) {
      return sendError(
        request,
        reply,
        403,
        'upscale_4k_not_allowed',
        '4K processing is only available on Ultra plan.',
        { plan: logicalPlan }
      );
    }

    if (body.options.callback_url && !entitlements.canUseAutomation && !isAdmin) {
      return sendError(
        request,
        reply,
        403,
        'automation_not_allowed',
        'Webhooks and automation are only available on Ultra plan.',
        { plan: logicalPlan }
      );
    }

    const fileCount = body.files.length;
    if (!isAdmin) {
      const creditCheck = await checkCreditsAvailability(request.auth.user.id, plan, fileCount);
      if (!creditCheck.ok) {
        return sendError(
          request,
          reply,
          402,
          'insufficient_credits',
          'Not enough credits to start this processing job.',
          {
            needed: creditCheck.needed,
            available: creditCheck.available,
            plan
          }
        );
      }
      if (fileCount > limits.maxBatchLinks) {
        return sendError(
          request,
          reply,
          429,
          'plan_limit_reached',
          'You have exceeded your plan limits for this workspace.',
          {
            plan,
            max_batch_links: limits.maxBatchLinks,
            requested_files: fileCount
          }
        );
      }
    }

    const batchId = randomUUID();
    const itemIds = body.files.map(() => randomUUID());

    let createdBatch: Awaited<ReturnType<typeof prisma.batch.create>>;
    try {
      createdBatch = await prisma.$transaction(async (tx) => {
        const batch = await tx.batch.create({
          data: {
            id: batchId,
            user_id: request.auth!.user.id,
            name: body.name ?? `UpScale_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}`,
            status: 'created',
            item_count: fileCount,
            options: {
              job_type: 'upscale',
              processing: body.options.processing_mode,
              target_resolution: body.options.target_resolution,
              target_format: body.options.target_format,
              archive_as_zip: body.options.archive_as_zip ?? true
            },
            callback_url: body.options.callback_url ?? null
          }
        });

        await tx.batchItem.createMany({
          data: body.files.map((file, index) => ({
            id: itemIds[index]!,
            batch_id: batch.id,
            user_id: request.auth!.user.id,
            original_url: file.filename,
            provider: 'upload',
            status: 'pending',
            processing_mode: body.options.processing_mode,
            processing_status: 'pending'
          }))
        });

        const now = new Date();
        await tx.file.createMany({
          data: body.files.map((file, index) => {
            const itemId = itemIds[index]!;
            const safeName = file.filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
            const key = `uploads/${batchId}/${itemId}/${safeName}`;
            return {
              id: randomUUID(),
              item_id: itemId,
              batch_id: batch.id,
              user_id: request.auth!.user.id,
              storage_path: key,
              filename: safeName,
              file_size_bytes: BigInt(file.size_bytes ?? 0),
              mime_type: file.content_type ?? null,
              expires_at: new Date(now.getTime() + limits.fileTtlHours * 3600 * 1000)
            };
          })
        });

        if (!isAdmin) {
          const creditDeduction = await deductCreditsForBatchTx(tx, request.auth!.user.id, plan, fileCount);
          if (!creditDeduction.ok) {
            throw new Error(`INSUFFICIENT_CREDITS:${creditDeduction.needed}:${creditDeduction.available}`);
          }
          await tx.creditLedger.create({
            data: {
              user_id: request.auth!.user.id,
              amount: creditDeduction.needed,
              reason: 'batch_start',
              batch_id: batch.id
            }
          });
        }

        return batch;
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.message.startsWith('INSUFFICIENT_CREDITS:')) {
        const [, neededRaw, availableRaw] = error.message.split(':');
        return sendError(
          request,
          reply,
          402,
          'insufficient_credits',
          'Not enough credits to start this processing job.',
          {
            needed: Number(neededRaw),
            available: Number(availableRaw),
            plan
          }
        );
      }
      throw error;
    }

    const uploadInfos = await Promise.all(
      body.files.map(async (file, index) => {
        const itemId = itemIds[index]!;
        const safeName = file.filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const key = `uploads/${batchId}/${itemId}/${safeName}`;
        const contentType = file.content_type || 'application/octet-stream';
        const url = await signedPutUrl(key, contentType, 3600);
        return {
          item_id: itemId,
          filename: file.filename,
          upload_url: url,
          headers: {
            'Content-Type': contentType
          }
        };
      })
    );

    return reply.status(201).send({
      id: createdBatch.id,
      name: createdBatch.name,
      status: createdBatch.status,
      item_count: fileCount,
      created_at: createdBatch.created_at.toISOString(),
      options: {
        processing_mode: body.options.processing_mode,
        target_resolution: body.options.target_resolution,
        target_format: body.options.target_format,
        archive_as_zip: body.options.archive_as_zip ?? true
      },
      files: uploadInfos
    });
  });

  app.post('/v1/upscale/jobs/:id/start', async (request, reply) => {
    if (!request.auth) {
      return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header.');
    }

    const { id } = request.params as { id: string };
    const batch = await prisma.batch.findFirst({
      where: { id, user_id: request.auth.user.id }
    });
    if (!batch) {
      return sendError(request, reply, 404, 'not_found', 'UpScale job not found.', { id });
    }

    const options = (batch.options as any) ?? {};
    if (options.job_type !== 'upscale') {
      return sendError(request, reply, 404, 'not_found', 'UpScale job not found.', { id });
    }

    const items = await prisma.batchItem.findMany({
      where: { batch_id: id, status: { in: ['pending', 'queued'] } }
    });

    if (items.length === 0) {
      request.log.info(
        { batchId: id, msg: 'upscale_start_no_items', hint: 'No pending/queued items; batch may already be started or items in wrong status.' }
      );
      return reply.send({ id: batch.id, status: batch.status, item_count: batch.item_count });
    }

    const plan = await getPlan(request.auth.user.id);
    const isAdmin = request.auth.isAdmin === true;
    const planForEnqueue = isAdmin ? 'enterprise' : plan;

    await prisma.batch.update({
      where: { id },
      data: { status: 'processing' }
    });

    for (const item of items) {
      await prisma.batchItem.update({
        where: { id: item.id },
        data: {
          status: 'queued',
          processing_status: 'queued',
          updated_at: new Date()
        }
      });
      await enqueueProcessingJob(id, item.id, request.auth.user.id, planForEnqueue);
    }

    request.log.info(
      { batchId: id, itemCount: items.length, msg: 'upscale_start_enqueued', queue: 'batchtube-processing' }
    );
    return reply.send({ id: batch.id, status: 'processing', item_count: batch.item_count });
  });

  app.get('/v1/upscale/jobs', async (request, reply) => {
    if (!request.auth) {
      return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header.');
    }

    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid query parameters.', {
        issues: parsed.error.issues
      });
    }

    const { page, limit } = parsed.data;

    const [rows, total] = await Promise.all([
      prisma.batch.findMany({
        where: { user_id: request.auth.user.id },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: {
            select: { status: true, progress: true }
          }
        }
      }),
      prisma.batch.count({ where: { user_id: request.auth.user.id } })
    ]);

    const upscaleRows = rows.filter((row) => {
      const opts = (row.options as any) ?? {};
      return opts.job_type === 'upscale';
    });

    const data = upscaleRows.map((batch) => {
      const totalItems = batch.item_count;
      const items = batch.items;
      const completed = items.filter((i) => i.status === 'completed').length;
      const failed = items.filter((i) => i.status === 'failed').length;
      const processing = items.filter((i) => i.status === 'processing').length;
      const queued = items.filter((i) => i.status === 'queued' || i.status === 'pending').length;
      const progress =
        totalItems === 0
          ? 0
          : Math.max(
              0,
              Math.min(
                100,
                items.reduce(
                  (sum, item) => sum + (typeof item.progress === 'number' ? item.progress : 0),
                  0
                ) / Math.max(totalItems, 1)
              )
            );

      return {
        id: batch.id,
        name: batch.name,
        status: batch.status,
        progress,
        item_count: totalItems,
        created_at: batch.created_at.toISOString(),
        queued,
        processing,
        completed,
        failed
      };
    });

    return reply.send({
      data,
      meta: {
        page,
        limit,
        total: upscaleRows.length
      }
    });
  });

  app.get('/v1/upscale/jobs/:id', async (request, reply) => {
    if (!request.auth) {
      return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header.');
    }

    const { id } = request.params as { id: string };

    const batch = await prisma.batch.findFirst({
      where: { id, user_id: request.auth.user.id },
      include: {
        items: {
          orderBy: { created_at: 'asc' },
          include: {
            files: true
          }
        }
      }
    });

    if (!batch) {
      return sendError(request, reply, 404, 'not_found', 'UpScale job not found.', { id });
    }

    const opts = (batch.options as any) ?? {};
    if (opts.job_type !== 'upscale') {
      return sendError(request, reply, 404, 'not_found', 'UpScale job not found.', { id });
    }

    const totalItems = batch.item_count;
    const items = batch.items;
    const completed = items.filter((i) => i.status === 'completed').length;
    const failed = items.filter((i) => i.status === 'failed').length;
    const processing = items.filter((i) => i.status === 'processing').length;
    const queued = items.filter((i) => i.status === 'queued' || i.status === 'pending').length;
    const progress =
      totalItems === 0
        ? 0
        : Math.max(
            0,
            Math.min(
              100,
              items.reduce(
                (sum, item) => sum + (typeof item.progress === 'number' ? item.progress : 0),
                0
              ) / Math.max(totalItems, 1)
            )
          );

    return reply.send({
      id: batch.id,
      name: batch.name,
      status: batch.status,
      progress,
      item_count: totalItems,
      created_at: batch.created_at.toISOString(),
      queued,
      processing,
      completed,
      failed,
      options: {
        processing_mode: opts.processing ?? 'none',
        target_resolution: opts.target_resolution ?? '1080p',
        target_format: opts.target_format ?? 'mp4',
        archive_as_zip: Boolean(opts.archive_as_zip ?? true)
      },
      items: items.map((item) => {
        const file = item.files?.[0] ?? null;
        return {
          id: item.id,
          original_name: item.original_url,
          status: item.status,
          progress: item.progress,
          has_output: item.processing_status === 'completed' && Boolean(file),
          file_id: file?.id ?? null
        };
      }),
      zip_ready: Boolean(batch.zip_file_path)
    });
  });
};

export default upscaleRoute;

