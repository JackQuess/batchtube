import { createHmac } from 'node:crypto';
import { config } from '../config.js';
import { prisma } from './db.js';
import { updateProfilePlan, type SaaSPlan } from './plans.js';
import { redis } from './redis.js';

type PaddlePlan = 'pro' | 'archivist' | 'enterprise';

const getPriceId = (plan: PaddlePlan): string => {
  if (plan === 'pro') return config.paddle.priceIdPro;
  if (plan === 'archivist') return config.paddle.priceIdArchivist;
  return config.paddle.priceIdEnterprise;
};

export async function createPaddleCheckout(params: { userId: string; email: string; plan: PaddlePlan }) {
  const priceId = getPriceId(params.plan);
  if (!priceId || !config.paddle.apiKey) {
    throw new Error('Paddle is not configured.');
  }

  const response = await fetch(`${config.paddle.apiBase}/transactions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.paddle.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      items: [{ price_id: priceId, quantity: 1 }],
      customer: { email: params.email },
      custom_data: {
        user_id: params.userId,
        plan: params.plan
      },
      checkout: {
        url: config.paddle.successUrl || undefined
      }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Paddle checkout failed: ${body}`);
  }

  const json = await response.json() as any;
  const checkoutUrl = json?.data?.checkout?.url;
  if (!checkoutUrl) {
    throw new Error('Paddle checkout URL missing.');
  }
  return checkoutUrl as string;
}

export function verifyPaddleSignature(rawBody: string, header: string | undefined): boolean {
  if (!config.paddle.webhookSecret) return false;
  if (!header) return false;

  const received = header.split('=').pop()?.trim();
  if (!received) return false;

  const expected = createHmac('sha256', config.paddle.webhookSecret)
    .update(rawBody)
    .digest('hex');
  return expected === received;
}

const mapEventToPlan = (eventType: string, payload: any): SaaSPlan => {
  if (eventType === 'subscription_cancelled') return 'free';
  const plan = payload?.data?.custom_data?.plan;
  if (plan === 'enterprise' || plan === 'archivist' || plan === 'pro') return plan;
  return 'free';
};

export async function handlePaddleWebhook(eventType: string, payload: any) {
  const eventId = payload?.event_id || payload?.id;
  if (!eventId) return;

  const eventKey = `paddle:webhook:${eventId}`;
  const first = await redis.set(eventKey, '1', 'EX', 60 * 60 * 24, 'NX');
  if (first !== 'OK') return;

  const userId = payload?.data?.custom_data?.user_id || payload?.data?.customer?.custom_data?.user_id;
  if (!userId) return;

  const customerId = payload?.data?.customer_id || payload?.data?.customer?.id || null;
  const subscriptionId = payload?.data?.subscription_id || payload?.data?.id || null;
  const plan = mapEventToPlan(eventType, payload);

  await updateProfilePlan(userId, plan, customerId, subscriptionId);

  await prisma.auditLog.create({
    data: {
      user_id: userId,
      action: 'billing.webhook'
    }
  });
}
