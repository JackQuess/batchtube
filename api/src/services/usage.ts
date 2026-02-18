import { prisma } from './db.js';

export function getCurrentPeriodStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function getCycleReset(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0)).toISOString();
}

export async function getOrCreateUsageCounter(userId: string) {
  const periodStart = getCurrentPeriodStart();

  const existing = await prisma.usageCounter.findUnique({
    where: {
      user_id_period_start: {
        user_id: userId,
        period_start: periodStart
      }
    }
  });

  if (existing) return existing;

  return prisma.usageCounter.create({
    data: {
      user_id: userId,
      period_start: periodStart,
      bandwidth_bytes: BigInt(0),
      items_processed: 0
    }
  });
}

export async function incrementItemsProcessed(userId: string, increment: number) {
  const periodStart = getCurrentPeriodStart();
  await getOrCreateUsageCounter(userId);

  return prisma.usageCounter.update({
    where: {
      user_id_period_start: {
        user_id: userId,
        period_start: periodStart
      }
    },
    data: {
      items_processed: {
        increment
      }
    }
  });
}

export async function incrementBandwidthBytes(userId: string, increment: bigint) {
  const periodStart = getCurrentPeriodStart();
  await getOrCreateUsageCounter(userId);

  return prisma.usageCounter.update({
    where: {
      user_id_period_start: {
        user_id: userId,
        period_start: periodStart
      }
    },
    data: {
      bandwidth_bytes: {
        increment
      }
    }
  });
}
