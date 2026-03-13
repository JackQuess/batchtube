import { describe, expect, it, beforeEach } from 'vitest';

async function loadModule() {
  return import('../src/services/providerSmoke.js');
}

describe('provider smoke snapshot', () => {
  beforeEach(() => {
    process.env.PROVIDER_SMOKE_URLS_JSON = '';
  });

  it('returns snapshot with skipped providers when no smoke URLs configured', async () => {
    const { runProviderSmokeCheck } = await loadModule();
    const snapshot = await runProviderSmokeCheck({ force: true });
    expect(snapshot.summary.total).toBeGreaterThan(0);
    expect(snapshot.summary.skipped).toBe(snapshot.summary.total);
  });
});
