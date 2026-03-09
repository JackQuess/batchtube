import type { FastifyPluginAsync } from 'fastify';
import { verifyLemonSignature, handleLemonWebhook } from '../services/lemonsqueezy.js';
import { sendError } from '../utils/errors.js';

const lemonsqueezyWebhookRoute: FastifyPluginAsync = async (app) => {
  app.post('/webhooks/lemonsqueezy', async (request, reply) => {
    const rawBody = typeof request.body === 'string' ? request.body : JSON.stringify(request.body ?? {});
    const signature = (request.headers['x-signature'] as string | undefined) ?? (request.headers['X-Signature'] as string | undefined);

    if (!verifyLemonSignature(rawBody, signature)) {
      return sendError(request, reply, 401, 'unauthorized', 'Invalid Lemon Squeezy webhook signature');
    }

    const payload = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
    const eventType = (payload?.meta?.event_name || payload?.event) as string | undefined;
    if (!eventType) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid webhook payload');
    }

    await handleLemonWebhook(eventType as any, payload);
    return reply.send({ ok: true });
  });
};

export default lemonsqueezyWebhookRoute;

