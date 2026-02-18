import { createHmac } from 'node:crypto';
import { prisma } from './db.js';

export async function sendBatchWebhook(params: {
  batchId: string;
  event: 'batch.completed' | 'batch.failed';
  status: 'completed' | 'failed';
  successfulItems: number;
  failedItems: number;
}) {
  const batch = await prisma.batch.findUnique({ where: { id: params.batchId } });
  if (!batch?.callback_url) return;

  const user = await prisma.user.findUnique({ where: { id: batch.user_id } });
  if (!user?.webhook_secret) return;

  const payload = {
    event: params.event,
    timestamp: new Date().toISOString(),
    data: {
      batch_id: params.batchId,
      status: params.status,
      successful_items: params.successfulItems,
      failed_items: params.failedItems
    }
  };

  const body = JSON.stringify(payload);
  const signature = createHmac('sha256', user.webhook_secret).update(body).digest('hex');

  await fetch(batch.callback_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-BatchTube-Event': params.event,
      'X-BatchTube-Signature': signature
    },
    body
  }).catch(() => undefined);
}
