import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { sendError } from '../utils/errors.js';
import { createPaddleCheckout, handlePaddleWebhook, verifyPaddleSignature } from '../services/paddle.js';
import { prisma } from '../services/db.js';
import { verifySupabaseJWT } from '../plugins/auth.js';
import { getPlan } from '../services/plans.js';

const createCheckoutSchema = z.object({
  plan: z.enum(['pro', 'archivist', 'enterprise'])
});

const billingRoute: FastifyPluginAsync = async (app) => {
  app.post('/billing/create-checkout', async (request, reply) => {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header');
    }
    const token = authorization.slice(7).trim();

    let payload: any;
    try {
      payload = await verifySupabaseJWT(token);
    } catch {
      return sendError(request, reply, 401, 'unauthorized', 'Invalid or expired token');
    }
    const userId = payload?.sub as string | undefined;
    if (!userId) {
      return sendError(request, reply, 401, 'unauthorized', 'Token subject is missing');
    }

    const parsed = createCheckoutSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid request body.', {
        issues: parsed.error.issues
      });
    }

    const jwtEmail = typeof payload?.email === 'string' ? payload.email : `${userId}@supabase.local`;
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: { email: jwtEmail },
      create: { id: userId, email: jwtEmail, password_hash: '__supabase_jwt_auth__' }
    });

    const currentPlan = await getPlan(userId);
    if (currentPlan === parsed.data.plan) {
      return sendError(request, reply, 400, 'validation_error', 'Requested plan is already active.');
    }

    try {
      const url = await createPaddleCheckout({
        userId: user.id,
        email: user.email,
        plan: parsed.data.plan
      });
      return reply.send({ url });
    } catch (error: any) {
      return sendError(request, reply, 500, 'internal_server_error', error?.message || 'Checkout creation failed');
    }
  });

  app.post('/billing/webhook', async (request, reply) => {
    const rawBody = typeof request.body === 'string' ? request.body : JSON.stringify(request.body ?? {});
    const signature = request.headers['paddle-signature'] as string | undefined;
    if (!verifyPaddleSignature(rawBody, signature)) {
      return sendError(request, reply, 401, 'unauthorized', 'Invalid webhook signature');
    }

    const payload = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
    const eventType = payload?.event_type || payload?.event;
    if (!eventType) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid webhook payload');
    }

    await handlePaddleWebhook(eventType, payload);
    return reply.send({ ok: true });
  });
};

export default billingRoute;
