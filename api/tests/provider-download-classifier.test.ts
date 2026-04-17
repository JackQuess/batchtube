import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

async function loadClassifier() {
  vi.resetModules();
  const mod = await import('../src/services/download.js');
  return mod.classifyGenericProviderError;
}

describe('classifyGenericProviderError fixtures', () => {
  beforeEach(() => {
    delete process.env.YT_DLP_COOKIES_FILE;
    delete process.env.YT_DLP_COOKIES_FROM_BROWSER;
  });

  const cases: Array<{ name: string; stderr: string; code: string; retriable: boolean }> = [
    { name: '429', stderr: 'ERROR: HTTP Error 429: Too Many Requests', code: 'provider_rate_limited', retriable: true },
    { name: 'too many requests text', stderr: 'Too many requests', code: 'provider_rate_limited', retriable: true },
    { name: 'rate limit phrase', stderr: 'rate limit exceeded', code: 'provider_rate_limited', retriable: true },
    { name: '401', stderr: 'ERROR: HTTP Error 401: Unauthorized', code: 'provider_access_denied', retriable: true },
    { name: '403', stderr: 'ERROR: HTTP Error 403: Forbidden', code: 'provider_access_denied', retriable: true },
    { name: 'forbidden', stderr: 'forbidden by upstream', code: 'provider_access_denied', retriable: true },
    {
      name: 'instagram blocking',
      stderr: 'ERROR: [instagram] Unable to download video — blocking detected',
      code: 'provider_rate_limited',
      retriable: true
    },
    {
      name: 'instagram challenge',
      stderr: 'ERROR: [instagram] challenge_required',
      code: 'provider_rate_limited',
      retriable: true
    },
    {
      name: 'instagram login wording retriable',
      stderr: 'ERROR: [instagram] Please log in to access this reel',
      code: 'provider_access_denied',
      retriable: true
    },
    {
      name: 'instagram sign in retriable',
      stderr: 'ERROR: [instagram] Sign in to see this content',
      code: 'provider_access_denied',
      retriable: true
    },
    {
      name: 'tiktok session retriable',
      stderr: 'ERROR: [tiktok] Login required for this clip',
      code: 'provider_access_denied',
      retriable: true
    },
    {
      name: 'tiktok cookies hint',
      stderr: 'ERROR: [tiktok] cookies are needed for this url',
      code: 'provider_access_denied',
      retriable: true
    },
    {
      name: 'generic login required permanent',
      stderr: 'ERROR: [vimeo] Login required to download',
      code: 'provider_auth_required',
      retriable: false
    },
    {
      name: 'generic sign in permanent',
      stderr: 'ERROR: Please sign in to continue',
      code: 'provider_auth_required',
      retriable: false
    },
    {
      name: 'geo',
      stderr: 'not available in your country',
      code: 'provider_geo_restricted',
      retriable: false
    },
    {
      name: 'geo restrict phrase',
      stderr: 'geo restricted in your region',
      code: 'provider_geo_restricted',
      retriable: false
    },
    {
      name: 'private removed',
      stderr: 'This video is private and has been removed',
      code: 'provider_source_unavailable',
      retriable: false
    },
    { name: '404', stderr: 'HTTP Error 404', code: 'provider_source_unavailable', retriable: false },
    { name: 'not found', stderr: 'page not found', code: 'provider_source_unavailable', retriable: false },
    {
      name: 'unsupported',
      stderr: 'ERROR: Unsupported URL: https://example.com/x',
      code: 'provider_unsupported',
      retriable: false
    },
    {
      name: 'no suitable extractor',
      stderr: 'no suitable extractor',
      code: 'provider_unsupported',
      retriable: false
    },
    {
      name: 'extractorerror',
      stderr: 'ERROR: ExtractorError: foo',
      code: 'provider_extractor_failure',
      retriable: true
    },
    {
      name: 'unable to extract',
      stderr: 'unable to extract video data',
      code: 'provider_extractor_failure',
      retriable: true
    },
    {
      name: 'http 502',
      stderr: 'HTTP Error 502: Bad Gateway',
      code: 'provider_transient',
      retriable: true
    },
    { name: 'etimedout', stderr: 'ETIMEDOUT', code: 'provider_transient', retriable: true },
    { name: 'econnreset', stderr: 'ECONNRESET', code: 'provider_transient', retriable: true },
    { name: 'timeout word', stderr: 'connection timeout', code: 'provider_transient', retriable: true },
    {
      name: 'unknown falls through',
      stderr: 'Something completely unrecognized xyz123',
      code: 'provider_unknown_failure',
      retriable: true
    },
    {
      name: 'video unavailable generic',
      stderr: 'ERROR: video unavailable',
      code: 'provider_source_unavailable',
      retriable: false
    },
    {
      name: 'authentication generic non-ig',
      stderr: 'ERROR: [twitter] authentication failed',
      code: 'provider_auth_required',
      retriable: false
    }
  ];

  for (const c of cases) {
    it(c.name, async () => {
      const classifyGenericProviderError = await loadClassifier();
      const r = classifyGenericProviderError(c.stderr);
      expect(r.code, c.name).toBe(c.code);
      expect(r.retriable, c.name).toBe(c.retriable);
    });
  }
});

describe('resolveSocialCookieModes', () => {
  let tmpFile: string;

  afterEach(() => {
    if (tmpFile && fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    delete process.env.YT_DLP_COOKIES_FILE;
    delete process.env.YT_DLP_COOKIES_FROM_BROWSER;
    delete process.env.YT_DLP_COOKIES_FROM_BROWSER_PROFILE;
    vi.resetModules();
  });

  it('orders file then browser then none when both envs set', async () => {
    tmpFile = path.join(os.tmpdir(), `bt-smoke-cookies-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, '# Netscape HTTP Cookie File\n');
    process.env.YT_DLP_COOKIES_FILE = tmpFile;
    process.env.YT_DLP_COOKIES_FROM_BROWSER = 'chrome';
    vi.resetModules();
    const { resolveSocialCookieModes } = await import('../src/services/download/cookies.js');
    expect(resolveSocialCookieModes()).toEqual(['file', 'browser', 'none']);
  });

  it('instagram flat attempts use first cookie mode from resolver', async () => {
    tmpFile = path.join(os.tmpdir(), `bt-ig-cookies-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, '# Netscape HTTP Cookie File\n');
    process.env.YT_DLP_COOKIES_FILE = tmpFile;
    vi.resetModules();
    const { buildInstagramFlatAttempts } = await import('../src/services/download/strategies/instagramStrategy.js');
    const attempts = buildInstagramFlatAttempts('https://www.instagram.com/p/abc/', 'mp4', 'best');
    expect(attempts[0]?.cookiesMode).toBe('file');
  });
});
