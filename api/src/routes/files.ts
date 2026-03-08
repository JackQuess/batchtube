import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/db.js';
import { writeAuditLog } from '../services/audit.js';
import { signedGetUrl } from '../storage/s3.js';
import { sendError } from '../utils/errors.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const listFilesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

const filesRoute: FastifyPluginAsync = async (app) => {
  // List files (must be before /:id/download to avoid "files" as id)
  app.get('/v1/files', async (request, reply) => {
    if (!request.auth) return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header.');

    const parsed = listFilesQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid query parameters.', {
        issues: parsed.error.issues
      });
    }
    const { page, limit } = parsed.data;

    const where = { user_id: request.auth.user.id };
    const [rows, total] = await Promise.all([
      prisma.file.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          filename: true,
          file_size_bytes: true,
          mime_type: true,
          expires_at: true,
          created_at: true
        }
      }),
      prisma.file.count({ where })
    ]);

    return reply.send({
      data: rows.map((f) => ({
        id: f.id,
        filename: f.filename,
        size: Number(f.file_size_bytes),
        mime: f.mime_type,
        expires_at: f.expires_at.toISOString(),
        created_at: f.created_at.toISOString()
      })),
      meta: { page, limit, total }
    });
  });

  app.get('/v1/files/:id/download', async (request, reply) => {
    if (!request.auth) return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header.');

    const { id } = request.params as { id: string };
    if (!UUID_RE.test(id)) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid file id.', { id });
    }

    const file = await prisma.file.findFirst({
      where: {
        id,
        user_id: request.auth.user.id
      }
    });

    if (!file) {
      return sendError(request, reply, 404, 'not_found', 'File not found.', { id });
    }

    const expiresInSeconds = 3600;
    const url = await signedGetUrl(file.storage_path, expiresInSeconds);
    const expires_at = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    await writeAuditLog({
      request,
      userId: request.auth.user.id,
      action: 'files.download_link',
      resourceId: id
    });

    return reply.send({ url, expires_at });
  });
};

export default filesRoute;
