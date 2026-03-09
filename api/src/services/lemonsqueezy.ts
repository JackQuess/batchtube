import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';
import { prisma } from './db.js';
import { type SaaSPlan } from './plans.js';

type LemonEventType =
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'subscription_resumed'
  | 'subscription_expired'
  | 'subscription_payment_success'
  | 'subscription_payment_failed';

interface LemonPayload {
  meta?: {
    event_name?: string;
    custom_data?: { user_id?: string; [key: string]: unknown };
  };
  data?: {
    id?: string;
    attributes?: {
      status?: string;
      variant_id?: number | string;
      customer_id?: number | string;
      user_email?: string;
      renews_at?: string | null;
      ends_at?: string | null;
    };
  };
}

const variantToPlan: Record<string, SaaSPlan> = {
  // Map Lemon Squeezy variant IDs (string) to stored SaaSPlan
  // e.g. '12345' => 'pro', '67890' => 'archivist'
};

function getPlanForVariant(variantId: string | number | undefined | null): SaaSPlan {
  const id = variantId != null ? String(variantId) : '';
  if (!id) return 'free';
  const mapped = variantToPlan[id];
  if (mapped) return mapped;
  if (id === config.lemonsqueezy.variantPro) return 'pro';
  if (id === config.lemonsqueezy.variantUltra) return 'archivist';
  return 'free';
}

export function verifyLemonSignature(rawBody: string, header: string | undefined): boolean {
  const secret = config.lemonsqueezy.webhookSecret;
  if (!secret || !header) return false;
  const received = header.trim();
  if (!received) return false;

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(received, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function resolveUserId(payload: LemonPayload): Promise<string | null> {
  const customUserId = payload.meta?.custom_data?.user_id;
  if (typeof customUserId === 'string' && customUserId.trim()) {
    return customUserId.trim();
  }

  const email = payload.data?.attributes?.user_email;
  if (email && typeof email === 'string') {
    const user = await prisma.user.findFirst({ where: { email } });
    return user?.id ?? null;
  }

  return null;
}

function isActiveStatus(status: string | undefined | null): boolean {
  if (!status) return false;
  const s = status.toLowerCase();
  return s === 'active' || s === 'on_trial' || s === 'trialing' || s === 'paused';
}

export async function handleLemonWebhook(eventType: LemonEventType, payload: LemonPayload) {
  const userId = await resolveUserId(payload);
  if (!userId) return;

  const attributes = payload.data?.attributes ?? {};
  const status = attributes.status ?? null;
  const variantId = attributes.variant_id ?? null;
  const customerId = attributes.customer_id ?? null;
  const renewsAt = attributes.renews_at ?? attributes.renews_at ?? null;
  const endsAt = attributes.ends_at ?? null;

  const isActive = isActiveStatus(status);
  let plan: SaaSPlan = 'free';

  if (isActive) {
    plan = getPlanForVariant(variantId);
  } else if (eventType === 'subscription_cancelled' || eventType === 'subscription_expired') {
    plan = 'free';
  } else {
    // For payment_failed / non-active but not explicit cancel/expire, keep current plan.
    const existing = await prisma.profile.findUnique({ where: { id: userId }, select: { plan: true } });
    plan = existing?.plan ?? 'free';
  }

  await prisma.profile.upsert({
    where: { id: userId },
    create: {
      id: userId,
      plan,
      lemonsqueezy_customer_id: customerId != null ? String(customerId) : null,
      lemonsqueezy_subscription_id: payload.data?.id ?? null,
      lemonsqueezy_variant_id: variantId != null ? String(variantId) : null,
      lemonsqueezy_status: status,
      lemonsqueezy_current_period_end: renewsAt ? new Date(renewsAt) : endsAt ? new Date(endsAt) : null
    },
    update: {
      plan,
      lemonsqueezy_customer_id: customerId != null ? String(customerId) : null,
      lemonsqueezy_subscription_id: payload.data?.id ?? null,
      lemonsqueezy_variant_id: variantId != null ? String(variantId) : null,
      lemonsqueezy_status: status,
      lemonsqueezy_current_period_end: renewsAt ? new Date(renewsAt) : endsAt ? new Date(endsAt) : null,
      updated_at: new Date()
    }
  });

  await prisma.auditLog.create({
    data: {
      user_id: userId,
      action: 'billing.lemonsqueezy_webhook'
    }
  });
}

