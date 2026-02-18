import type { FastifyRequest } from 'fastify';
import { prisma } from './db.js';

export async function writeAuditLog(params: {
  request?: FastifyRequest;
  userId?: string;
  action: string;
  resourceId?: string;
}) {
  const ip = params.request?.ip ?? null;
  const ua = (params.request?.headers['user-agent'] as string | undefined) ?? null;

  await prisma.auditLog.create({
    data: {
      user_id: params.userId ?? null,
      action: params.action,
      resource_id: params.resourceId ?? null,
      ip_address: ip,
      user_agent: ua
    }
  }).catch(() => undefined);
}
