import { describe, expect, it, beforeEach, vi } from 'vitest';

async function loadDownloadModule() {
  vi.resetModules();
  return import('../src/services/download.js');
}

describe('youtube error classifier', () => {
  beforeEach(() => {
    delete process.env.YT_DLP_COOKIES_FROM_BROWSER;
    delete process.env.YT_DLP_COOKIES_FROM_BROWSER_PROFILE;
  });

  it('classifies "page needs to be reloaded" as antibot retriable', async () => {
    const { classifyYoutubeError } = await loadDownloadModule();
    const result = classifyYoutubeError('ERROR: [youtube] abc123: The page needs to be reloaded.');

    expect(result.code).toBe('youtube_antibot');
    expect(result.retriable).toBe(true);
    expect(result.clientRetriable).toBe(true);
  });

  it('classifies private video as permanent', async () => {
    const { classifyYoutubeError } = await loadDownloadModule();
    const result = classifyYoutubeError('ERROR: [youtube] Private video. Sign in if you have been granted access.');

    expect(result.code).toBe('youtube_private');
    expect(result.retriable).toBe(false);
  });

  it('classifies requested format unavailable as extractor fallback', async () => {
    const { classifyYoutubeError } = await loadDownloadModule();
    const result = classifyYoutubeError('ERROR: [youtube] abc123: Requested format is not available');

    expect(result.code).toBe('youtube_extractor_failure');
    expect(result.retriable).toBe(true);
    expect(result.clientRetriable).toBe(false);
  });
});

describe('youtube fallback planner', () => {
  beforeEach(() => {
    delete process.env.YT_DLP_COOKIES_FROM_BROWSER;
    delete process.env.YT_DLP_COOKIES_FROM_BROWSER_PROFILE;
  });

  it('adds hardened and format fallback attempts for transient failures', async () => {
    const { planYoutubeNextAttempts } = await loadDownloadModule();

    const failedAttempt = {
      selector: 'bestvideo+bestaudio/best',
      selectorIndex: 0,
      cookiesMode: 'none',
      hardened: false,
      clientStrategyIndex: 0,
      strategyName: 'fast_primary'
    };

    const next = planYoutubeNextAttempts({
      failedAttempt,
      classification: {
        code: 'youtube_transient',
        retriable: true,
        authError: false,
        clientRetriable: false
      },
      formatSelectorCount: 3,
      availableCookieModes: []
    });

    expect(next.some((a) => a.hardened)).toBe(true);
    expect(next.some((a) => a.selectorIndex === 1)).toBe(true);
  });

  it('for login-required only schedules cookie attempts', async () => {
    const { planYoutubeNextAttempts } = await loadDownloadModule();

    const failedAttempt = {
      selector: 'bestvideo+bestaudio/best',
      selectorIndex: 0,
      cookiesMode: 'none',
      hardened: false,
      clientStrategyIndex: 0,
      strategyName: 'fast_primary'
    };

    const next = planYoutubeNextAttempts({
      failedAttempt,
      classification: {
        code: 'youtube_login_required',
        retriable: false,
        authError: true,
        clientRetriable: false
      },
      formatSelectorCount: 3,
      availableCookieModes: ['browser']
    });

    expect(next.length).toBe(1);
    expect(next[0]?.cookiesMode).toBe('browser');
    expect(next[0]?.hardened).toBe(true);
  });
});

describe('yt-dlp arg builder', () => {
  it('includes browser cookie import and hardened retry flags in safe mode', async () => {
    process.env.YT_DLP_COOKIES_FROM_BROWSER = 'chrome';
    process.env.YT_DLP_COOKIES_FROM_BROWSER_PROFILE = 'Default';
    process.env.YT_DLP_RETRIES_SAFE = '4';
    process.env.YT_DLP_FRAGMENT_RETRIES_SAFE = '5';
    process.env.YT_DLP_CONCURRENT_FRAGMENTS_SAFE = '7';
    process.env.YT_DLP_EXTRACTOR_RETRIES_SAFE = '6';

    const { buildYtDlpArgs } = await loadDownloadModule();
    const args = buildYtDlpArgs({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      format: 'mp4',
      qualityOrSelector: 'bestvideo+bestaudio/best',
      outputTemplate: '/tmp/test.%(ext)s',
      cookiesMode: 'browser',
      options: {
        hardened: true,
        extractorArgs: 'youtube:player_client=web',
        provider: 'youtube'
      }
    });

    expect(args).toContain('--cookies-from-browser');
    expect(args).toContain('chrome:Default');
    expect(args).toContain('--retries');
    expect(args).toContain('4');
    expect(args).toContain('--fragment-retries');
    expect(args).toContain('5');
    expect(args).toContain('-N');
    expect(args).toContain('7');
    expect(args).toContain('--extractor-retries');
    expect(args).toContain('6');
  });

  it('includes generic fallback headers when provided', async () => {
    const { buildYtDlpArgs } = await loadDownloadModule();
    const args = buildYtDlpArgs({
      url: 'https://tau-video.xyz/embed/abc',
      format: 'mp4',
      qualityOrSelector: 'bv*+ba/b',
      outputTemplate: '/tmp/test.%(ext)s',
      cookiesMode: 'none',
      options: {
        hardened: true,
        extraHeaders: [{ key: 'Referer', value: 'https://tau-video.xyz/' }]
      }
    });

    expect(args).toContain('--add-header');
    expect(args).toContain('Referer: https://tau-video.xyz/');
  });
});

describe('youtube probed selector chooser', () => {
  it('prefers direct avc1 mp4 video plus m4a audio ids', async () => {
    const { selectYoutubeFormatSelectorFromFormats } = await loadDownloadModule();
    const selector = selectYoutubeFormatSelectorFromFormats(
      [
        { format_id: '137', ext: 'mp4', vcodec: 'avc1.640028', acodec: 'none', height: 1080, protocol: 'https' },
        { format_id: '136', ext: 'mp4', vcodec: 'avc1.4d401f', acodec: 'none', height: 720, protocol: 'https' },
        { format_id: '140', ext: 'm4a', vcodec: 'none', acodec: 'mp4a.40.2', protocol: 'https' }
      ],
      'mp4',
      '1080p'
    );

    expect(selector).toBe('137+140');
  });
});

