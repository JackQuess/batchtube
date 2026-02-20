import { describe, expect, it, vi, beforeEach } from 'vitest';

const tx = {
  $executeRaw: vi.fn(async () => 1),
  $queryRaw: vi.fn(async () => [{ credits_used: 0 }]),
  usageCounter: {
    update: vi.fn(async () => ({}))
  },
  creditLedger: {
    create: vi.fn(async () => ({}))
  }
};

const prismaMock = {
  profile: {
    upsert: vi.fn(async () => ({ plan: 'pro' }))
  },
  usageCounter: {
    upsert: vi.fn(async () => ({ credits_used: 0 }))
  },
  batch: {
    count: vi.fn(async () => 0)
  }
};

vi.mock('../src/services/db.js', () => ({
  prisma: prismaMock
}));

describe('credits plan service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deducts credits for a batch when balance is enough', async () => {
    const { deductCreditsForBatchTx } = await import('../src/services/plans.js');
    const result = await deductCreditsForBatchTx(tx as any, '11111111-1111-4111-8111-111111111111', 'pro', 5, '22222222-2222-4222-8222-222222222222');

    expect(result.ok).toBe(true);
    expect(result.needed).toBe(5);
    expect(tx.usageCounter.update).toHaveBeenCalledTimes(1);
    expect(tx.creditLedger.create).toHaveBeenCalledTimes(1);
  });

  it('fails batch start when credits are insufficient', async () => {
    tx.$queryRaw.mockResolvedValueOnce([{ credits_used: 998 }]);
    const { deductCreditsForBatchTx } = await import('../src/services/plans.js');
    const result = await deductCreditsForBatchTx(tx as any, '11111111-1111-4111-8111-111111111111', 'pro', 10);

    expect(result.ok).toBe(false);
    expect(result.needed).toBe(10);
    expect(result.available).toBe(2);
    expect(tx.usageCounter.update).not.toHaveBeenCalled();
  });

  it('monthly usage lookup returns used/available/limit', async () => {
    prismaMock.usageCounter.upsert.mockResolvedValueOnce({ credits_used: 258 });
    const { getCreditsUsage } = await import('../src/services/plans.js');
    const usage = await getCreditsUsage('11111111-1111-4111-8111-111111111111', 'pro');

    expect(usage.used).toBe(258);
    expect(usage.limit).toBe(1000);
    expect(usage.available).toBe(742);
  });

  it('checkCreditsAvailability computes cost as 1 credit per URL', async () => {
    prismaMock.usageCounter.upsert.mockResolvedValueOnce({ credits_used: 95 });
    const { checkCreditsAvailability } = await import('../src/services/plans.js');
    const result = await checkCreditsAvailability('11111111-1111-4111-8111-111111111111', 'free', 10);

    expect(result.ok).toBe(false);
    expect(result.needed).toBe(10);
    expect(result.available).toBe(5);
    expect(result.limit).toBe(100);
  });

  it('monthly period anchor is first day of current month', async () => {
    const { getCurrentPeriodStart } = await import('../src/services/usage.js');
    const periodStart = getCurrentPeriodStart();

    expect(periodStart.getUTCDate()).toBe(1);
    expect(periodStart.getUTCHours()).toBe(0);
    expect(periodStart.getUTCMinutes()).toBe(0);
  });
});
