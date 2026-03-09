/**
 * POST /v1/archive — instant channel/playlist archive.
 * Creates batch immediately with status resolving_channel; expansion runs in background.
 */

import { randomUUID } from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { enqueueChannelArchive } from '../queues/enqueue.js';
import { writeAuditLog } from '../services/audit.js';
import { prisma } from '../services/db.js';
import { getPlan, getEntitlements, toLogicalPlan } from '../services/plans.js';
import { getChannelMetadata } from '../services/channelMetadata.js';
import { resolveSource, type SourceType } from '../services/sourceResolver.js';
import { sendError } from '../utils/errors.js';

const archiveBodySchema = z.object({
  source_url: z.string().url(),
  mode: z.enum(['latest_25', 'latest_n', 'all', 'select']),
  latest_n: z.number().int().min(1).max(500).optional(),
  options: z.object({
    format: z.enum(['mp4', 'mp3', 'mkv']).optional(),
    quality: z.enum(['best', '4k', '1080p', '720p']).optional(),
    archive_as_zip: z.boolean().optional()
  }).optional()
});

const ARCHIVE_SOURCE_TYPES: SourceType[] = ['channel', 'playlist', 'profile'];

const archiveRoute: FastifyPluginAsync = async (app) => {
  app.post('/v1/archive', async (request, reply) => {
    if (!request.auth) {
      return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header.');
    }

    const parsed = archiveBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid request body.', {
        issues: parsed.error.issues
      });
    }

    const { source_url, mode, latest_n, options } = parsed.data;

    const resolved = resolveSource(source_url);
    if (!resolved || !resolved.allowed) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid or disallowed source URL.');
    }
    if (!ARCHIVE_SOURCE_TYPES.includes(resolved.sourceType)) {
      return sendError(request, reply, 400, 'validation_error', 'URL must be a channel, playlist, or profile.');
    }

    const plan = await getPlan(request.auth.user.id);
    const entitlements = getEntitlements(plan);
    const logicalPlan = toLogicalPlan(plan);

    if (!entitlements.canArchiveChannels && !request.auth.isAdmin) {
      return sendError(
        request,
        reply,
        403,
        'channel_archive_not_allowed',
        'Channel archive is not available on your plan.',
        { plan: logicalPlan }
      );
    }

    if (options?.quality === '4k' && !entitlements.canUseUpscale4k && !request.auth.isAdmin) {
      return sendError(
        request,
        reply,
        403,
        'upscale_4k_not_allowed',
        '4K quality is only available on Ultra plan.',
        { plan: logicalPlan }
      );
    }
    if (!request.auth.isAdmin) {
      // Enforce max playlist/archive size by plan.
      const maxItems = entitlements.maxPlaylistItems;
      if (mode === 'latest_25' && maxItems < 25) {
        return sendError(
          request,
          reply,
          403,
          'playlist_too_large_for_plan',
          `Your plan allows up to ${maxItems} items per archive request.`,
          { plan: logicalPlan, max_playlist_items: maxItems, requested: 25 }
        );
      }
      if (mode === 'latest_n' && typeof latest_n === 'number' && latest_n > maxItems) {
        return sendError(
          request,
          reply,
          403,
          'playlist_too_large_for_plan',
          `Your plan allows up to ${maxItems} items per archive request.`,
          { plan: logicalPlan, max_playlist_items: maxItems, requested: latest_n }
        );
      }
      if (mode === 'all' && maxItems < 5000) {
        return sendError(
          request,
          reply,
          403,
          'playlist_too_large_for_plan',
          `Your plan does not support full channel archives. Try a smaller selection or upgrade.`,
          { plan: logicalPlan, max_playlist_items: maxItems, requested: 'all' }
        );
      }
    }
    const isAdmin = request.auth.isAdmin === true;

    // Optional: fast channel metadata for instant UI (don't block on failure)
    let channelMeta: { title: string; thumbnail: string | null } = { title: 'Channel', thumbnail: null };
    try {
      channelMeta = await getChannelMetadata(resolved.url);
    } catch {
      // keep defaults
    }

    const batchId = randomUUID();
    const batchOptions = {
      format: options?.format ?? 'mp4',
      quality: options?.quality ?? 'best',
      archive_as_zip: options?.archive_as_zip ?? false,
      archive_source_url: resolved.url,
      archive_source_type: resolved.sourceType,
      archive_mode: mode,
      archive_latest_n: mode === 'latest_n' ? (latest_n ?? 25) : mode === 'latest_25' ? 25 : undefined
    };

    await prisma.batch.create({
      data: {
        id: batchId,
        user_id: request.auth.user.id,
        name: `Archive: ${channelMeta.title}`,
        status: 'resolving_channel',
        item_count: 0,
        options: batchOptions
      }
    });

    try {
      await enqueueChannelArchive(batchId, request.auth.user.id, isAdmin ? 'enterprise' : plan);
    } catch (err) {
      request.log.error({ err, batchId }, 'archive_enqueue_failed');
      await prisma.batch.update({
        where: { id: batchId },
        data: { status: 'failed' }
      });
      return sendError(request, reply, 503, 'service_unavailable', 'Queue unavailable. Please retry.');
    }

    await writeAuditLog({
      request,
      userId: request.auth.user.id,
      action: 'archive.create',
      resourceId: batchId
    });

    return reply.status(201).send({
      id: batchId,
      name: `Archive: ${channelMeta.title}`,
      status: 'resolving_channel',
      progress: 0,
      item_count: 0,
      created_at: new Date().toISOString(),
      channel_detected: true,
      channel: {
        title: channelMeta.title,
        thumbnail: channelMeta.thumbnail
      }
    });
  });
};

export default archiveRoute;
