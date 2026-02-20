import { Prisma, type PlanTier } from '@prisma/client';
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/db.js';
import { sendError } from '../utils/errors.js';
import { generateApiKey } from '../utils/crypto.js';
import { writeAuditLog } from '../services/audit.js';

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

const kpiQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30)
});

const usersQuerySchema = paginationSchema.extend({
  search: z.string().optional().default('')
});

const patchUserSchema = z.object({
  plan: z.enum(['starter', 'power_user', 'archivist', 'enterprise']).optional(),
  disabled: z.boolean().optional()
}).refine((v) => v.plan !== undefined || v.disabled !== undefined, {
  message: 'At least one field must be provided.'
});

const keyCreateSchema = z.object({
  name: z.string().max(50).optional()
});

const auditQuerySchema = paginationSchema.extend({
  action: z.string().optional(),
  user_id: z.string().uuid().optional()
});

function getCurrentMonthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

const adminRoute: FastifyPluginAsync = async (app) => {
  app.get('/admin-api/health', async (request, reply) => {
    return reply.send({ ok: true });
  });

  app.get('/admin-api/kpis', async (request, reply) => {
    const parsed = kpiQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid query parameters.', {
        issues: parsed.error.issues
      });
    }

    const since = new Date(Date.now() - parsed.data.days * 24 * 60 * 60 * 1000);

    const [totalUsers, activeResult, totalBatchesDays, totalItemsDays, bandwidthAgg] = await Promise.all([
      prisma.user.count(),
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT user_id)::bigint AS count
        FROM api_keys
        WHERE last_used_at >= ${since}
      `,
      prisma.batch.count({ where: { created_at: { gte: since } } }),
      prisma.batchItem.count({ where: { created_at: { gte: since } } }),
      prisma.file.aggregate({
        _sum: { file_size_bytes: true },
        where: { created_at: { gte: since } }
      })
    ]);

    await writeAuditLog({ request, action: 'admin.kpis.get' });

    return reply.send({
      total_users: totalUsers,
      active_users_days: Number(activeResult[0]?.count ?? 0n),
      total_batches_days: totalBatchesDays,
      total_items_days: totalItemsDays,
      bandwidth_days_bytes: Number(bandwidthAgg._sum.file_size_bytes ?? 0n)
    });
  });

  app.get('/admin-api/users', async (request, reply) => {
    const parsed = usersQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid query parameters.', {
        issues: parsed.error.issues
      });
    }

    const { page, limit, search } = parsed.data;
    const monthStart = getCurrentMonthStart();

    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { id: { equals: search } }
          ]
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    const userIds = users.map((u) => u.id);

    const [usageRows, lastUsedRows] = await Promise.all([
      userIds.length
        ? prisma.usageCounter.findMany({
            where: { user_id: { in: userIds }, period_start: monthStart }
          })
        : Promise.resolve([]),
      userIds.length
        ? prisma.apiKey.groupBy({
            by: ['user_id'],
            where: { user_id: { in: userIds } },
            _max: { last_used_at: true }
          })
        : Promise.resolve([])
    ]);

    const usageMap = new Map(usageRows.map((r) => [r.user_id, r]));
    const lastUsedMap = new Map(lastUsedRows.map((r) => [r.user_id, r._max.last_used_at ?? null]));

    await writeAuditLog({ request, action: 'admin.users.list' });

    return reply.send({
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        plan: u.plan,
        disabled: u.disabled,
        created_at: u.created_at.toISOString(),
        last_used_at: lastUsedMap.get(u.id)?.toISOString?.() ?? null,
        month_items_processed: usageMap.get(u.id)?.batches_processed ?? 0,
        month_bandwidth_bytes: Number(usageMap.get(u.id)?.bandwidth_bytes ?? 0n)
      })),
      meta: { page, limit, total }
    });
  });

  app.get('/admin-api/users/:id', async (request, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(request.params);
    if (!params.success) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid user id.', {
        issues: params.error.issues
      });
    }

    const userId = params.data.id;
    const monthStart = getCurrentMonthStart();

    const [user, apiKeys, usage, recentBatches] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.apiKey.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' }
      }),
      prisma.usageCounter.findUnique({
        where: { user_id_period_start: { user_id: userId, period_start: monthStart } }
      }),
      prisma.batch.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: 20,
        select: {
          id: true,
          name: true,
          status: true,
          item_count: true,
          created_at: true,
          completed_at: true
        }
      })
    ]);

    if (!user) {
      return sendError(request, reply, 404, 'not_found', 'User not found.', { id: userId });
    }

    await writeAuditLog({ request, action: 'admin.users.get', userId });

    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        disabled: user.disabled,
        created_at: user.created_at.toISOString(),
        webhook_secret: user.webhook_secret
      },
      api_keys: apiKeys.map((k) => ({
        id: k.id,
        name: k.name,
        key_prefix: k.key_prefix,
        last_used_at: k.last_used_at?.toISOString() ?? null,
        created_at: k.created_at.toISOString()
      })),
      usage: usage
        ? {
            period_start: usage.period_start.toISOString().slice(0, 10),
            items_processed: usage.batches_processed,
            bandwidth_bytes: Number(usage.bandwidth_bytes)
          }
        : {
            period_start: monthStart.toISOString().slice(0, 10),
            items_processed: 0,
            bandwidth_bytes: 0
          },
      recent_batches: recentBatches.map((b) => ({
        id: b.id,
        name: b.name,
        status: b.status,
        item_count: b.item_count,
        created_at: b.created_at.toISOString(),
        completed_at: b.completed_at?.toISOString() ?? null
      }))
    });
  });

  app.patch('/admin-api/users/:id', async (request, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(request.params);
    if (!params.success) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid user id.', {
        issues: params.error.issues
      });
    }

    const parsed = patchUserSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid request body.', {
        issues: parsed.error.issues
      });
    }

    const userId = params.data.id;
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return sendError(request, reply, 404, 'not_found', 'User not found.', { id: userId });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(parsed.data.plan ? { plan: parsed.data.plan as PlanTier } : {}),
        ...(parsed.data.disabled !== undefined ? { disabled: parsed.data.disabled } : {})
      }
    });

    if (parsed.data.disabled === true) {
      await prisma.apiKey.deleteMany({ where: { user_id: userId } });
    }

    await writeAuditLog({ request, action: 'admin.users.patch', userId, resourceId: userId });

    return reply.send({
      id: updated.id,
      email: updated.email,
      plan: updated.plan,
      disabled: updated.disabled,
      created_at: updated.created_at.toISOString(),
      webhook_secret: updated.webhook_secret
    });
  });

  app.post('/admin-api/users/:id/api-keys', async (request, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(request.params);
    if (!params.success) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid user id.', {
        issues: params.error.issues
      });
    }

    const parsed = keyCreateSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid request body.', {
        issues: parsed.error.issues
      });
    }

    const userId = params.data.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return sendError(request, reply, 404, 'not_found', 'User not found.', { id: userId });
    }

    const key = generateApiKey('bt_live_');
    const created = await prisma.apiKey.create({
      data: {
        user_id: userId,
        key_prefix: 'bt_live_',
        key_hash: key.hash,
        name: parsed.data.name ?? 'Admin created key'
      }
    });

    await writeAuditLog({ request, action: 'admin.keys.create', userId, resourceId: created.id });

    return reply.send({
      id: created.id,
      name: created.name,
      key: key.plain,
      created_at: created.created_at.toISOString()
    });
  });

  app.delete('/admin-api/api-keys/:id', async (request, reply) => {
    const params = z.object({ id: z.string().uuid() }).safeParse(request.params);
    if (!params.success) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid key id.', {
        issues: params.error.issues
      });
    }

    const existing = await prisma.apiKey.findUnique({ where: { id: params.data.id } });
    if (!existing) {
      return sendError(request, reply, 404, 'not_found', 'API key not found.', { id: params.data.id });
    }

    await prisma.apiKey.delete({ where: { id: params.data.id } });
    await writeAuditLog({ request, action: 'admin.keys.delete', userId: existing.user_id, resourceId: existing.id });

    return reply.send({ ok: true });
  });

  app.get('/admin-api/audit-logs', async (request, reply) => {
    const parsed = auditQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return sendError(request, reply, 400, 'validation_error', 'Invalid query parameters.', {
        issues: parsed.error.issues
      });
    }

    const { page, limit, action, user_id } = parsed.data;

    const where: Prisma.AuditLogWhereInput = {
      ...(action ? { action: { contains: action, mode: 'insensitive' } } : {}),
      ...(user_id ? { user_id } : {})
    };

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ]);

    await writeAuditLog({ request, action: 'admin.audit_logs.list' });

    return reply.send({
      data: rows.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        action: r.action,
        resource_id: r.resource_id,
        ip_address: r.ip_address,
        user_agent: r.user_agent,
        created_at: r.created_at.toISOString()
      })),
      meta: { page, limit, total }
    });
  });
};

export default adminRoute;
