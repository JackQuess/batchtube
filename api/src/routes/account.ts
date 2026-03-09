import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { writeAuditLog } from '../services/audit.js';
import { getCreditsUsage, getPlan, toLogicalPlan, getEntitlements } from '../services/plans.js';
import { getCycleReset } from '../services/usage.js';
import { sendError } from '../utils/errors.js';
import { prisma } from '../services/db.js';
import crypto from 'node:crypto';

const accountRoute: FastifyPluginAsync = async (app) => {
  app.get('/v1/account/usage', async (request, reply) => {
    if (!request.auth) return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header.');

    let plan: 'free' | 'pro' | 'archivist' | 'enterprise' = 'free';
    let credits = { used: 0, limit: 100, available: 100 };
    let logicalPlan: 'free' | 'pro' | 'ultra' = 'free';
    let webhookUrl: string | null = null;
    try {
      plan = await getPlan(request.auth.user.id);
      logicalPlan = toLogicalPlan(plan);
      credits = await getCreditsUsage(request.auth.user.id, plan);
      const user = await prisma.user.findUnique({
        where: { id: request.auth.user.id },
        select: { webhook_url: true }
      });
      webhookUrl = user?.webhook_url ?? null;
    } catch (error) {
      request.log.error({ err: error, requestId: request.id, userId: request.auth.user.id }, 'account_usage_compute_failed');
    }

    await writeAuditLog({
      request,
      userId: request.auth.user.id,
      action: 'account.usage'
    });

    return reply.send({
      plan,
      plan_logical: logicalPlan,
      cycle_reset: getCycleReset(),
      credits: {
        used: credits.used,
        limit: credits.limit,
        available: credits.available
      },
      webhook_url: webhookUrl,
      is_admin: request.auth.isAdmin === true
    });
  });

  app.post('/v1/account/webhook', async (request, reply) => {
    if (!request.auth) return sendError(request, reply, 401, 'unauthorized', 'Missing or invalid Authorization header.');

    const bodySchema = z.object({
      url: z.string().url().nullable().optional()
    });
    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid request body.', {
        issues: parsed.error.issues
      });
    }

    const plan = await getPlan(request.auth.user.id);
    const entitlements = getEntitlements(plan);
    const logicalPlan = toLogicalPlan(plan);

    if (!entitlements.canUseAutomation && !request.auth.isAdmin) {
      return sendError(
        request,
        reply,
        403,
        'automation_not_allowed',
        'Webhooks are only available on the Ultra plan.',
        { plan: logicalPlan }
      );
    }

    const url = parsed.data.url ?? null;

    const existing = await prisma.user.findUnique({
      where: { id: request.auth.user.id },
      select: { webhook_secret: true }
    });

    let webhookSecret = existing?.webhook_secret ?? null;
    if (!webhookSecret && url) {
      // Generate a secret used to sign outgoing webhooks for this user.
      webhookSecret = crypto.randomBytes(32).toString('hex');
    }

    await prisma.user.update({
      where: { id: request.auth.user.id },
      data: {
        webhook_url: url,
        ...(webhookSecret ? { webhook_secret: webhookSecret } : {})
      }
    });

    await writeAuditLog({
      request,
      userId: request.auth.user.id,
      action: 'account.webhook_update'
    });

    return reply.send({
      webhook_url: url
    });
  });
};

export default accountRoute;
