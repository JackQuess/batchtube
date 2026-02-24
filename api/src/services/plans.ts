import { Prisma } from '@prisma/client';
import { prisma } from './db.js';
import { getCurrentPeriodStart } from './usage.js';

export type SaaSPlan = 'free' | 'pro' | 'archivist' | 'enterprise';

export interface PlanLimits {
  maxBatchLinks: number;
  monthlyCredits: number;
  concurrency: number;
  rateLimitPerMinute: number;
  fileTtlHours: number;
  apiAccess: boolean;
  costPerUrl: number;
}

export interface CreditUsage {
  used: number;
  limit: number;
  available: number;
  periodStart: Date;
}

export interface CreditCheckResult {
  ok: boolean;
  needed: number;
  available: number;
  used: number;
  limit: number;
}

export const PLAN_LIMITS: Record<SaaSPlan, PlanLimits> = {
  free: {
    maxBatchLinks: 10,
    monthlyCredits: 100,
    concurrency: 1,
    rateLimitPerMinute: 30,
    fileTtlHours: 6,
    apiAccess: false,
    costPerUrl: 1
  },
  pro: {
    maxBatchLinks: 50,
    monthlyCredits: 1000,
    concurrency: 3,
    rateLimitPerMinute: 120,
    fileTtlHours: 24,
    apiAccess: false,
    costPerUrl: 1
  },
  archivist: {
    maxBatchLinks: 50,
    monthlyCredits: 5000,
    concurrency: 10,
    rateLimitPerMinute: 500,
    fileTtlHours: 168,
    apiAccess: true,
    costPerUrl: 1
  },
  enterprise: {
    maxBatchLinks: 50,
    monthlyCredits: 10000,
    concurrency: 20,
    rateLimitPerMinute: 1000,
    fileTtlHours: 168,
    apiAccess: true,
    costPerUrl: 1
  }
};

const asInt = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') return Number(value);
  return 0;
};

const isPrismaMissingSchemaError = (error: unknown): boolean => {
  const code = (error as { code?: string } | null)?.code;
  return code === 'P2021' || code === 'P2022' || code === '42P01' || code === '42703';
};

export const normalizePlan = (value: string | null | undefined): SaaSPlan => {
  if (!value) return 'free';
  if (value === 'free' || value === 'pro' || value === 'archivist' || value === 'enterprise') return value;
  if (value === 'starter') return 'free';
  if (value === 'power_user') return 'pro';
  return 'free';
};

export async function getPlan(userId: string): Promise<SaaSPlan> {
  try {
    const row = await prisma.profile.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, plan: 'free' },
      select: { plan: true }
    });
    return normalizePlan(row.plan);
  } catch (error) {
    if (isPrismaMissingSchemaError(error)) return 'free';
    throw error;
  }
}

export async function enforceBatchLimit(urlsLength: number, plan: SaaSPlan) {
  return urlsLength <= PLAN_LIMITS[plan].maxBatchLinks;
}

export async function enforceConcurrency(userId: string, plan: SaaSPlan) {
  const limit = PLAN_LIMITS[plan].concurrency;
  const active = await prisma.batch.count({
    where: {
      user_id: userId,
      status: { in: ['queued', 'processing'] }
    }
  });
  return { allowed: active < limit, active, limit };
}

export async function getCreditsUsage(userId: string, plan: SaaSPlan): Promise<CreditUsage> {
  const periodStart = getCurrentPeriodStart();

  const limit = PLAN_LIMITS[plan].monthlyCredits;
  try {
    const row = await prisma.usageCounter.upsert({
      where: {
        user_id_period_start: {
          user_id: userId,
          period_start: periodStart
        }
      },
      update: {},
      create: {
        user_id: userId,
        period_start: periodStart,
        batches_processed: 0,
        credits_used: 0,
        bandwidth_bytes: BigInt(0)
      },
      select: {
        credits_used: true
      }
    });

    const used = asInt(row.credits_used);
    const available = Math.max(0, limit - used);

    return {
      used,
      limit,
      available,
      periodStart
    };
  } catch (error) {
    if (!isPrismaMissingSchemaError(error)) throw error;

    return {
      used: 0,
      limit,
      available: limit,
      periodStart
    };
  }
}

export async function checkCreditsAvailability(userId: string, plan: SaaSPlan, urlsLength: number): Promise<CreditCheckResult> {
  const limits = PLAN_LIMITS[plan];
  const needed = urlsLength * limits.costPerUrl;
  const usage = await getCreditsUsage(userId, plan);

  return {
    ok: usage.available >= needed,
    needed,
    available: usage.available,
    used: usage.used,
    limit: usage.limit
  };
}

export async function deductCreditsForBatchTx(
  tx: Prisma.TransactionClient,
  userId: string,
  plan: SaaSPlan,
  urlsLength: number,
  batchId?: string
): Promise<CreditCheckResult> {
  const limits = PLAN_LIMITS[plan];
  const needed = urlsLength * limits.costPerUrl;
  const periodStart = getCurrentPeriodStart();

  await tx.$executeRaw(Prisma.sql`
    INSERT INTO usage_counters (user_id, period_start, batches_processed, credits_used, bandwidth_bytes)
    VALUES (${userId}::uuid, ${periodStart}::date, 0, 0, 0)
    ON CONFLICT (user_id, period_start) DO NOTHING
  `);

  const rows = await tx.$queryRaw<Array<{ credits_used: number }>>(Prisma.sql`
    SELECT credits_used
    FROM usage_counters
    WHERE user_id = ${userId}::uuid
      AND period_start = ${periodStart}::date
    FOR UPDATE
  `);

  const used = asInt(rows[0]?.credits_used ?? 0);
  const limit = limits.monthlyCredits;
  const available = Math.max(0, limit - used);

  if (available < needed) {
    return {
      ok: false,
      needed,
      available,
      used,
      limit
    };
  }

  await tx.usageCounter.update({
    where: {
      user_id_period_start: {
        user_id: userId,
        period_start: periodStart
      }
    },
    data: {
      credits_used: {
        increment: needed
      },
      batches_processed: {
        increment: 1
      }
    }
  });

  await tx.creditLedger.create({
    data: {
      user_id: userId,
      amount: needed,
      reason: 'batch_start',
      batch_id: batchId ?? null
    }
  });

  return {
    ok: true,
    needed,
    available: available - needed,
    used: used + needed,
    limit
  };
}

export async function incrementBandwidth(userId: string, bytes: bigint) {
  const periodStart = getCurrentPeriodStart();
  await prisma.usageCounter.upsert({
    where: {
      user_id_period_start: {
        user_id: userId,
        period_start: periodStart
      }
    },
    update: {
      bandwidth_bytes: { increment: bytes }
    },
    create: {
      user_id: userId,
      period_start: periodStart,
      batches_processed: 0,
      credits_used: 0,
      bandwidth_bytes: bytes
    }
  });
}

export async function updateProfilePlan(
  userId: string,
  plan: SaaSPlan,
  paddleCustomerId?: string | null,
  paddleSubscriptionId?: string | null
) {
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO profiles (id, plan, paddle_customer_id, paddle_subscription_id)
    VALUES (
      ${userId}::uuid,
      ${plan}::profile_plan,
      ${paddleCustomerId ?? null},
      ${paddleSubscriptionId ?? null}
    )
    ON CONFLICT (id) DO UPDATE
    SET
      plan = EXCLUDED.plan,
      paddle_customer_id = COALESCE(EXCLUDED.paddle_customer_id, profiles.paddle_customer_id),
      paddle_subscription_id = COALESCE(EXCLUDED.paddle_subscription_id, profiles.paddle_subscription_id),
      updated_at = NOW()
  `);
}
