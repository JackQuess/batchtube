import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../services/db.js';
import { writeAuditLog } from '../services/audit.js';
import { signedGetUrl } from '../storage/s3.js';
import { sendError } from '../utils/errors.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const filesRoute: FastifyPluginAsync = async (app) => {
  app.get('/v1/files/:id/download', async (request, reply) => {
    if (!request.auth) return sendError(request, reply, 401, 'unauthorized', 'Missing API key.');

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
