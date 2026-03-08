import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { listSourceItems } from '../services/sourceList.js';
import { getPreviewMetadata } from '../services/previewMetadata.js';
import { normalizeInput } from '../services/inputNormalizer.js';
import { resolveToProviderResult } from '../services/sourceResolver.js';
import { sendError } from '../utils/errors.js';

const itemsQuerySchema = z.object({
  url: z.string().url(),
  type: z.enum(['channel', 'playlist', 'profile']),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

const previewQuerySchema = z.object({
  url: z.string().url()
});

const resolveQuerySchema = z.object({
  url: z.string().url()
});

const normalizeBodySchema = z.object({
  raw: z.string()
});

const sourcesRoute: FastifyPluginAsync = async (app) => {
  /** Input normalization: raw paste → normalizedUrls, invalidEntries, duplicatesRemovedCount */
  app.post('/v1/sources/normalize', async (request, reply) => {
    if (!request.auth) {
      return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header.');
    }
    const parsed = normalizeBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid body.', { issues: parsed.error.issues });
    }
    const result = normalizeInput(parsed.data.raw);
    return reply.send(result);
  });

  /** Resolver: url → ProviderResolverResult (provider, sourceType, capabilities) */
  app.get('/v1/sources/resolve', async (request, reply) => {
    if (!request.auth) {
      return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header.');
    }
    const parsed = resolveQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid query.', { issues: parsed.error.issues });
    }
    const result = resolveToProviderResult(parsed.data.url);
    if (!result) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid or unsupported URL.');
    }
    return reply.send(result);
  });

  app.get('/v1/sources/preview', async (request, reply) => {
    if (!request.auth) {
      return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header.');
    }
    const parsed = previewQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid query.', { issues: parsed.error.issues });
    }
    try {
      const result = await getPreviewMetadata(parsed.data.url);
      return reply.send(result);
    } catch (err) {
      request.log.warn({ err, url: (request.query as { url?: string }).url }, 'sources_preview_error');
      return sendError(request, reply, 422, 'validation_error', 'Preview unavailable.');
    }
  });

  app.get('/v1/sources/items', async (request, reply) => {
    if (!request.auth) {
      return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header.');
    }

    const parsed = itemsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid query.', {
        issues: parsed.error.issues
      });
    }

    const { url, type, page, limit } = parsed.data;

    try {
      const result = await listSourceItems(url, type, { page, limit });
      return reply.send(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      request.log.warn({ err, url, type }, 'sources_items_error');
      // Preview/list errors only — never surface download error codes (e.g. youtube_age_restricted)
      if (message === 'LISTING_UNAVAILABLE') {
        return sendError(request, reply, 422, 'validation_error', 'This source could not be listed. Try "Download latest" or "Download all" from the SmartBar.');
      }
      return sendError(request, reply, 400, 'validation_error', message);
    }
  });
};

export default sourcesRoute;
