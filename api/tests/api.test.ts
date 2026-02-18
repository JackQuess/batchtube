import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => {
  const user = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'demo@batchtube.app',
    password_hash: 'hash',
    plan: 'starter' as const,
    stripe_customer_id: null,
    webhook_secret: 'whsec_demo',
    created_at: new Date(),
    updated_at: new Date()
  };

  const apiKey = {
    id: '22222222-2222-4222-8222-222222222222',
    user_id: user.id,
    key_prefix: 'bt_live_',
    key_hash: 'hash',
    name: 'Local Dev Key',
    last_used_at: null,
    created_at: new Date()
  };

  const batch = {
    id: '33333333-3333-4333-8333-333333333333',
    user_id: user.id,
    name: 'Test Batch',
    status: 'created' as const,
    options: {},
    callback_url: null,
    zip_file_path: null,
    item_count: 1,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    completed_at: null,
    items: [{ status: 'pending' as const }]
  };

  const prisma = {
    apiKey: {
      findFirst: vi.fn(async () => ({ ...apiKey, user })),
      update: vi.fn(async () => ({ ...apiKey }))
    },
    batch: {
      create: vi.fn(async () => ({ ...batch })),
      findMany: vi.fn(async () => [{ ...batch }]),
      count: vi.fn(async () => 1),
      findFirst: vi.fn(async () => ({ ...batch })),
      findUnique: vi.fn(async () => ({ ...batch, status: 'cancelled', items: [{ status: 'cancelled' }] })),
      update: vi.fn(async () => ({ ...batch, status: 'cancelled', items: [{ status: 'cancelled' }] }))
    },
    batchItem: {
      count: vi.fn(async () => 0),
      createMany: vi.fn(async () => ({ count: 1 })),
      updateMany: vi.fn(async () => ({ count: 1 })),
      findMany: vi.fn(async () => [{
        id: '44444444-4444-4444-8444-444444444444',
        batch_id: batch.id,
        user_id: user.id,
        original_url: 'https://www.youtube.com/watch?v=test',
        provider: 'youtube',
        status: 'completed',
        progress: 100,
        error_message: null,
        retry_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      }])
    },
    file: {
      findMany: vi.fn(async () => [{
        id: '55555555-5555-4555-8555-555555555555',
        item_id: '44444444-4444-4444-8444-444444444444'
      }])
    },
    usageCounter: {
      findUnique: vi.fn(async () => ({
        user_id: user.id,
        period_start: new Date('2026-01-01T00:00:00.000Z'),
        bandwidth_bytes: BigInt(0),
        items_processed: 0
      })),
      create: vi.fn(async () => ({
        user_id: user.id,
        period_start: new Date('2026-01-01T00:00:00.000Z'),
        bandwidth_bytes: BigInt(0),
        items_processed: 0
      })),
      update: vi.fn(async () => ({
        user_id: user.id,
        period_start: new Date('2026-01-01T00:00:00.000Z'),
        bandwidth_bytes: BigInt(0),
        items_processed: 1
      }))
    },
    auditLog: {
      create: vi.fn(async () => ({}))
    }
  };

  return { prisma };
});

vi.mock('../src/utils/crypto.js', () => ({
  sha256: () => 'hash'
}));

vi.mock('../src/services/redis.js', () => {
  const kv = new Map<string, string>();
  return {
    redis: {
      incr: vi.fn(async (key: string) => {
        const next = Number(kv.get(key) ?? '0') + 1;
        kv.set(key, String(next));
        return next;
      }),
      pexpire: vi.fn(async () => 1),
      get: vi.fn(async (key: string) => kv.get(key) ?? null),
      set: vi.fn(async (key: string, value: string) => {
        kv.set(key, value);
        return 'OK';
      })
    }
  };
});

vi.mock('../src/services/db.js', () => ({
  prisma: mockState.prisma
}));

vi.mock('../src/queues/enqueue.js', () => ({
  enqueueBatch: vi.fn(async () => undefined)
}));

import { createApp } from '../src/app.js';

describe('BatchTube API', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires authorization', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/batches' });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toHaveProperty('error.code', 'unauthorized');
  });

  it('creates batch', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/batches',
      headers: {
        authorization: 'Bearer bt_live_testkey',
        'idempotency-key': '11111111-1111-4111-8111-111111111111'
      },
      payload: {
        name: 'Social Media Backup 2026',
        urls: ['https://www.youtube.com/watch?v=test'],
        auto_start: false,
        options: { format: 'mp4', quality: '1080p', archive_as_zip: true }
      }
    });

    expect(res.statusCode).toBe(201);
    expect(res.json()).toHaveProperty('id');
    expect(res.json()).toHaveProperty('item_count', 1);
  });

  it('gets batch details', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/batches/33333333-3333-4333-8333-333333333333',
      headers: { authorization: 'Bearer bt_live_testkey' }
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty('status');
    expect(res.json()).toHaveProperty('progress');
  });

  it('lists items in batch', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/batches/33333333-3333-4333-8333-333333333333/items?page=1&limit=50',
      headers: { authorization: 'Bearer bt_live_testkey' }
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty('data');
    expect(res.json()).toHaveProperty('meta.total');
  });
});
