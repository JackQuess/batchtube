import Fastify from 'fastify';
import cors from '@fastify/cors';
import authPlugin from './plugins/auth.js';
import adminAuthPlugin from './plugins/admin-auth.js';
import rateLimitPlugin from './plugins/rate-limit.js';
import idempotencyPlugin from './plugins/idempotency.js';
import batchesRoute from './routes/batches.js';
import filesRoute from './routes/files.js';
import accountRoute from './routes/account.js';
import adminRoute from './routes/admin.js';
import { sendError } from './utils/errors.js';

export function createApp() {
  const app = Fastify({
    logger: true
  });

  app.register(cors, {
    origin: true,
    allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key']
  });

  app.get('/health', async () => ({ status: 'ok' }));

  app.register(authPlugin);
  app.register(adminAuthPlugin);
  app.register(rateLimitPlugin);
  app.register(idempotencyPlugin);

  app.register(batchesRoute);
  app.register(filesRoute);
  app.register(accountRoute);
  app.register(adminRoute);

  app.setNotFoundHandler((request, reply) => {
    return sendError(request, reply, 404, 'not_found', 'Resource not found.');
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error, requestId: request.id }, 'unhandled_error');
    if (reply.sent) return;
    return sendError(request, reply, 500, 'internal_server_error', 'Internal server error.');
  });

  return app;
}
