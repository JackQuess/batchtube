import Fastify from 'fastify';
import cors from '@fastify/cors';
import authPlugin from './plugins/auth.js';
import apiKeyAuthPlugin from './plugins/api-key-auth.js';
import rateLimitPlugin from './plugins/rate-limit.js';
import idempotencyPlugin from './plugins/idempotency.js';
import batchesRoute from './routes/batches.js';
import archiveRoute from './routes/archive.js';
import sourcesRoute from './routes/sources.js';
import filesRoute from './routes/files.js';
import accountRoute from './routes/account.js';
import apiKeysRoute from './routes/api-keys.js';
import billingRoute from './routes/billing.js';
import lemonsqueezyWebhookRoute from './routes/lemonsqueezy-webhook.js';
import { config } from './config.js';
import { sendError } from './utils/errors.js';

export function createApp() {
  const app = Fastify({
    logger: true
  });

  const allowedOrigins = config.cors.allowedOrigins;

  app.register(cors, {
    origin: (origin, cb) => {
      // No Origin header (curl/postman/server-to-server) should be allowed.
      if (!origin) {
        cb(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        cb(null, true);
        return;
      }
      // Reject without throwing so the server returns 403-style CORS rejection, not 500
      app.log.warn({ origin, allowedOrigins }, 'CORS origin not allowed – add it to ALLOWED_ORIGIN or CORS_ALLOWED_ORIGINS');
      cb(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key'],
    credentials: false,
    strictPreflight: true,
    optionsSuccessStatus: 204
  });

  app.addHook('onSend', async (request, reply) => {
    if (request.headers.origin) {
      reply.header('Vary', 'Origin');
      reply.header('Access-Control-Allow-Credentials', 'false');
    }
  });

  app.get('/health', async () => ({ status: 'ok' }));

  app.register(authPlugin);
  app.register(apiKeyAuthPlugin);
  app.register(rateLimitPlugin);
  app.register(idempotencyPlugin);

  app.register(batchesRoute);
  app.register(archiveRoute);
  app.register(sourcesRoute);
  app.register(filesRoute);
  app.register(accountRoute);
  app.register(apiKeysRoute);
  app.register(billingRoute);
  app.register(lemonsqueezyWebhookRoute);

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
