import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { listSourceItems } from '../services/sourceList.js';
import { sendError } from '../utils/errors.js';

const querySchema = z.object({
  url: z.string().url(),
  type: z.enum(['channel', 'playlist', 'profile']),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

const sourcesRoute: FastifyPluginAsync = async (app) => {
  app.get('/v1/sources/items', async (request, reply) => {
    if (!request.auth) {
      return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header.');
    }

    const parsed = querySchema.safeParse(request.query);
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
