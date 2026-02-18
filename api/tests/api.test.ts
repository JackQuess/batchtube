import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';

const mockState = vi.hoisted(() => {
  const user = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'demo@batchtube.app',
    password_hash: 'hash',
    plan: 'starter' as const,
    disabled: false,
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
    $queryRaw: vi.fn(async () => [{ count: 1n }]),
    apiKey: {
      findFirst: vi.fn(async () => ({ ...apiKey, user })),
      findUnique: vi.fn(async ({ where }: any) => (where.id ? apiKey : null)),
      update: vi.fn(async () => ({ ...apiKey })),
      delete: vi.fn(async () => ({})),
      deleteMany: vi.fn(async () => ({ count: 1 })),
      create: vi.fn(async () => ({ ...apiKey, id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' })),
      findMany: vi.fn(async () => [{ ...apiKey }]),
      groupBy: vi.fn(async () => [{ user_id: user.id, _max: { last_used_at: new Date('2026-01-02T00:00:00.000Z') } }])
    },
    user: {
      count: vi.fn(async () => 1),
      findMany: vi.fn(async () => [{ ...user }]),
      findUnique: vi.fn(async ({ where }: any) => {
        if (where?.id === user.id || where?.email?.toLowerCase?.() === user.email) return { ...user };
        return null;
      }),
      update: vi.fn(async ({ data }: any) => ({ ...user, ...data }))
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
      aggregate: vi.fn(async () => ({ _sum: { file_size_bytes: 123n } })),
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
      findMany: vi.fn(async () => [{
        user_id: user.id,
        period_start: new Date('2026-01-01T00:00:00.000Z'),
        bandwidth_bytes: BigInt(100),
        items_processed: 7
      }]),
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
      create: vi.fn(async () => ({})),
      findMany: vi.fn(async () => []),
      count: vi.fn(async () => 0)
    }
  };

  return { prisma, user };
});

vi.mock('../src/utils/crypto.js', async () => {
  const actual = await vi.importActual('../src/utils/crypto.js');
  return {
    ...(actual as object),
    sha256: () => 'hash',
    generateApiKey: () => ({ plain: 'bt_live_mock_generated_key', hash: 'hash' })
  };
});

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
      expire: vi.fn(async () => 1),
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

describe('BatchTube API', () => {
  let app: any;

  beforeAll(async () => {
    process.env.ADMIN_EMAIL = 'owner@batchtube.app';
    process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('admin123', 10);
    process.env.ADMIN_JWT_SECRET = 'test_admin_secret';
    const mod = await import('../src/app.js');
    app = mod.createApp();
  });

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

  it('admin login success sets cookie', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/admin-api/login',
      payload: { email: 'owner@batchtube.app', password: 'admin123' }
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
    expect(res.cookies.some((c) => c.name === 'bt_admin_session')).toBe(true);
  });

  it('admin users requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin-api/users' });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toHaveProperty('error.code', 'unauthorized');
  });

  it('admin users works with cookie', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/admin-api/login',
      payload: { email: 'owner@batchtube.app', password: 'admin123' }
    });

    const cookie = login.cookies.find((c) => c.name === 'bt_admin_session');
    expect(cookie).toBeTruthy();

    const res = await app.inject({
      method: 'GET',
      url: '/admin-api/users?page=1&limit=20',
      cookies: { bt_admin_session: cookie!.value }
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty('data');
    expect(res.json()).toHaveProperty('meta.total');
  });
});
