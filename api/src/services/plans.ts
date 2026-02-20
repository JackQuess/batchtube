import { Prisma } from '@prisma/client';
import { prisma } from './db.js';
import { getCurrentPeriodStart } from './usage.js';

export type SaaSPlan = 'free' | 'pro' | 'archivist' | 'enterprise';

export interface PlanLimits {
  maxBatchLinks: number;
  monthlyBatches: number;
  concurrency: number;
  rateLimitPerMinute: number;
  fileTtlHours: number;
  apiAccess: boolean;
}

export const PLAN_LIMITS: Record<SaaSPlan, PlanLimits> = {
  free: {
    maxBatchLinks: 50,
    monthlyBatches: 20,
    concurrency: 1,
    rateLimitPerMinute: 30,
    fileTtlHours: 6,
    apiAccess: false
  },
  pro: {
    maxBatchLinks: 50,
    monthlyBatches: 500,
    concurrency: 3,
    rateLimitPerMinute: 120,
    fileTtlHours: 24,
    apiAccess: false
  },
  archivist: {
    maxBatchLinks: 50,
    monthlyBatches: 3000,
    concurrency: 10,
    rateLimitPerMinute: 500,
    fileTtlHours: 168,
    apiAccess: true
  },
  enterprise: {
    maxBatchLinks: 50,
    monthlyBatches: 10000,
    concurrency: 20,
    rateLimitPerMinute: 1000,
    fileTtlHours: 168,
    apiAccess: true
  }
};

export const normalizePlan = (value: string | null | undefined): SaaSPlan => {
  if (!value) return 'free';
  if (value === 'free' || value === 'pro' || value === 'archivist' || value === 'enterprise') return value;
  if (value === 'starter') return 'free';
  if (value === 'power_user') return 'pro';
  return 'free';
};

export async function getPlan(userId: string): Promise<SaaSPlan> {
  const row = await prisma.profile.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, plan: 'free' },
    select: { plan: true }
  });
  return normalizePlan(row.plan);
}

export async function enforceBatchLimit(urlsLength: number, plan: SaaSPlan) {
  const limits = PLAN_LIMITS[plan];
  return urlsLength <= limits.maxBatchLinks;
}

export async function enforceConcurrency(userId: string, plan: SaaSPlan) {
  const limits = PLAN_LIMITS[plan];
  const active = await prisma.batch.count({
    where: {
      user_id: userId,
      status: { in: ['queued', 'processing'] }
    }
  });
  return { allowed: active < limits.concurrency, active, limit: limits.concurrency };
}

export async function enforceMonthlyQuota(userId: string, plan: SaaSPlan) {
  const limits = PLAN_LIMITS[plan];
  const periodStart = getCurrentPeriodStart();
  const usage = await prisma.usageCounter.upsert({
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
      bandwidth_bytes: BigInt(0)
    }
  });
  return {
    allowed: usage.batches_processed < limits.monthlyBatches,
    used: usage.batches_processed,
    limit: limits.monthlyBatches
  };
}

export async function incrementUsage(userId: string, batchCount: number) {
  const periodStart = getCurrentPeriodStart();
  await prisma.usageCounter.upsert({
    where: {
      user_id_period_start: {
        user_id: userId,
        period_start: periodStart
      }
    },
    update: {
      batches_processed: { increment: batchCount }
    },
    create: {
      user_id: userId,
      period_start: periodStart,
      batches_processed: batchCount,
      bandwidth_bytes: BigInt(0)
    }
  });
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
      bandwidth_bytes: bytes
    }
  });
}

export async function updateProfilePlan(userId: string, plan: SaaSPlan, paddleCustomerId?: string | null, paddleSubscriptionId?: string | null) {
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

