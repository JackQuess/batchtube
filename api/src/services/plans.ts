import { Prisma } from '@prisma/client';
import { prisma } from './db.js';
import { getCurrentPeriodStart } from './usage.js';

export type SaaSPlan = 'free' | 'pro' | 'archivist' | 'enterprise';

export interface PlanLimits {
  maxBatchLinks: number;
  /** Monthly item limit (processed media items). */
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
    // Free: up to 20 items per batch, 100 items/month
    maxBatchLinks: 20,
    monthlyCredits: 100,
    concurrency: 1,
    rateLimitPerMinute: 30,
    fileTtlHours: 6,
    apiAccess: false,
    costPerUrl: 1
  },
  pro: {
    // Pro: larger batches and 1000 items/month
    maxBatchLinks: 200,
    monthlyCredits: 1000,
    concurrency: 3,
    rateLimitPerMinute: 120,
    fileTtlHours: 24,
    apiAccess: false,
    costPerUrl: 1
  },
  archivist: {
    // Archivist/Enterprise map to logical Ultra plan (effectively very high limits)
    maxBatchLinks: 5000,
    monthlyCredits: 1000000,
    concurrency: 10,
    rateLimitPerMinute: 500,
    fileTtlHours: 168,
    apiAccess: true,
    costPerUrl: 1
  },
  enterprise: {
    maxBatchLinks: 5000,
    monthlyCredits: 1000000,
    concurrency: 20,
    rateLimitPerMinute: 1000,
    fileTtlHours: 168,
    apiAccess: true,
    costPerUrl: 1
  }
};

// Logical plans used for entitlements/pricing docs.
export type LogicalPlan = 'free' | 'pro' | 'ultra';

export interface PlanEntitlements {
  /** Monthly processed item limit (videos/audio). */
  monthlyItemLimit: number;
  /** Max playlist/archive items per request (where applicable). */
  maxPlaylistItems: number;
  /** Max allowed quality label (e.g. '1080p' or '4k'). */
  maxQuality: '1080p' | '4k';
  canArchiveChannels: boolean;
  canUseCli: boolean;
  canUseApi: boolean;
  canUseAutomation: boolean;
  canUseUpscale4k: boolean;
  canUseAdvancedProcessing: boolean;
  /** Lower number = higher priority in BullMQ. */
  queuePriority: number;
}

export const PLAN_ENTITLEMENTS: Record<LogicalPlan, PlanEntitlements> = {
  free: {
    monthlyItemLimit: 100,
    maxPlaylistItems: 20,
    maxQuality: '1080p',
    canArchiveChannels: false,
    canUseCli: false,
    canUseApi: false,
    canUseAutomation: false,
    canUseUpscale4k: false,
    canUseAdvancedProcessing: false,
    queuePriority: 8
  },
  pro: {
    monthlyItemLimit: 1000,
    maxPlaylistItems: 1000,
    maxQuality: '1080p',
    canArchiveChannels: true,
    canUseCli: true,
    canUseApi: false,
    canUseAutomation: false,
    canUseUpscale4k: false,
    canUseAdvancedProcessing: false,
    queuePriority: 4
  },
  ultra: {
    monthlyItemLimit: 1000000,
    maxPlaylistItems: 100000,
    maxQuality: '4k',
    canArchiveChannels: true,
    canUseCli: true,
    canUseApi: true,
    canUseAutomation: true,
    canUseUpscale4k: true,
    canUseAdvancedProcessing: true,
    queuePriority: 1
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

const isPrismaUnavailableError = (error: unknown): boolean => {
  const name = (error as { name?: string } | null)?.name;
  const code = (error as { code?: string } | null)?.code;
  return (
    name === 'PrismaClientInitializationError' ||
    code === 'P1001' || // Can't reach DB
    code === 'P1017'    // Server closed connection
  );
};

export const normalizePlan = (value: string | null | undefined): SaaSPlan => {
  if (!value) return 'free';
  if (value === 'free' || value === 'pro' || value === 'archivist' || value === 'enterprise') return value;
  if (value === 'starter') return 'free';
  if (value === 'power_user') return 'pro';
  return 'free';
};

/** Map stored SaaSPlan to logical pricing plan (free, pro, ultra). */
export const toLogicalPlan = (plan: SaaSPlan): LogicalPlan => {
  if (plan === 'free') return 'free';
  if (plan === 'pro') return 'pro';
  // archivist and enterprise are treated as Ultra for entitlements
  return 'ultra';
};

export const getEntitlements = (plan: SaaSPlan): PlanEntitlements => {
  return PLAN_ENTITLEMENTS[toLogicalPlan(plan)];
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
    // Table missing, DB unreachable, or FK (e.g. user not in users table yet) -> default to free
    if (
      isPrismaMissingSchemaError(error) ||
      isPrismaUnavailableError(error) ||
      (error as { code?: string })?.code === 'P2003'
    ) {
      return 'free';
    }
    throw error;
  }
}

export async function enforceBatchLimit(urlsLength: number, plan: SaaSPlan) {
  return urlsLength <= PLAN_LIMITS[plan].maxBatchLinks;
}

export async function enforceConcurrency(userId: string, plan: SaaSPlan) {
  const limit = PLAN_LIMITS[plan].concurrency;
  try {
    const active = await prisma.batch.count({
      where: {
        user_id: userId,
        status: { in: ['queued', 'processing', 'resolving_channel', 'discovering_items', 'queueing_items'] }
      }
    });
    return { allowed: active < limit, active, limit };
  } catch (error) {
    // DB unreachable, table missing, or Prisma init error -> allow request (fail open)
    if (
      isPrismaMissingSchemaError(error) ||
      isPrismaUnavailableError(error) ||
      (error as { name?: string })?.name === 'PrismaClientInitializationError'
    ) {
      return { allowed: true, active: 0, limit };
    }
    throw error;
  }
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
    if (
      !isPrismaMissingSchemaError(error) &&
      !isPrismaUnavailableError(error) &&
      (error as { name?: string })?.name !== 'PrismaClientInitializationError'
    ) {
      throw error;
    }

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
  urlsLength: number
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

  return {
    ok: true,
    needed,
    available: available - needed,
    used: used + needed,
    limit
  };
}

/** Deduct credits after archive expansion (outside batch-create tx). Creates credit_ledger entry. */
export async function deductCreditsForBatch(
  batchId: string,
  userId: string,
  plan: SaaSPlan,
  itemCount: number
): Promise<CreditCheckResult> {
  return prisma.$transaction(async (tx) => {
    const result = await deductCreditsForBatchTx(tx, userId, plan, itemCount);
    if (!result.ok) return result;
    await tx.creditLedger.create({
      data: {
        user_id: userId,
        amount: result.needed,
        reason: 'batch_start',
        batch_id: batchId
      }
    });
    return result;
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
