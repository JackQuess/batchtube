import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('CORS preflight', () => {
  let app: any;

  beforeAll(async () => {
    process.env.ALLOWED_ORIGIN = 'https://batchtube.net';
    process.env.ALLOWED_ORIGIN_2 = 'https://www.batchtube.net';
    const mod = await import('../src/app.js');
    app = mod.createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('responds to OPTIONS /v1/batches with required CORS headers', async () => {
    const origin = 'https://batchtube.net';
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/v1/batches',
      headers: {
        origin,
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'Authorization, Content-Type, Idempotency-Key'
      }
    });

    expect([200, 204]).toContain(res.statusCode);
    expect(res.headers['access-control-allow-origin']).toBe(origin);
    expect(String(res.headers['access-control-allow-credentials'])).toBe('false');
    expect(String(res.headers['access-control-allow-methods'])).toContain('OPTIONS');
    expect(String(res.headers['access-control-allow-headers'])).toContain('Authorization');
    expect(String(res.headers['access-control-allow-headers'])).toContain('Content-Type');
    expect(String(res.headers['access-control-allow-headers'])).toContain('Idempotency-Key');
    expect(String(res.headers['vary'] || '')).toContain('Origin');
  });
});

