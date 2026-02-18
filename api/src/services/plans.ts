import type { PlanTier } from '@prisma/client';

export interface PlanLimits {
  requestsPerMinute: number;
  concurrency: number;
  monthlyDownloads: number;
  bandwidthBytes: bigint;
  maxItemsPerBatch: number;
  retentionHours: number;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  starter: {
    requestsPerMinute: 60,
    concurrency: 2,
    monthlyDownloads: 1000,
    bandwidthBytes: BigInt(100_000_000_000),
    maxItemsPerBatch: 500,
    retentionHours: 24
  },
  power_user: {
    requestsPerMinute: 300,
    concurrency: 10,
    monthlyDownloads: 5000,
    bandwidthBytes: BigInt(500_000_000_000),
    maxItemsPerBatch: 2000,
    retentionHours: 72
  },
  archivist: {
    requestsPerMinute: 1000,
    concurrency: 50,
    monthlyDownloads: 10_000,
    bandwidthBytes: BigInt(1_000_000_000_000),
    maxItemsPerBatch: 5000,
    retentionHours: 24 * 7
  },
  enterprise: {
    requestsPerMinute: 5000,
    concurrency: 200,
    monthlyDownloads: 100_000,
    bandwidthBytes: BigInt(10_000_000_000_000),
    maxItemsPerBatch: 10_000,
    retentionHours: 24 * 7
  }
};
