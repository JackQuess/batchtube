import type { RunYtDlpOptions } from './types.js';

/** Instagram throttles heavily; slow single-stream pulls and space HTTP calls. */
export function ytDlpInstagramThrottleOptions(hardened: boolean): Pick<
  RunYtDlpOptions,
  'sleepRequestsSec' | 'concurrentFragmentsOverride'
> {
  return {
    sleepRequestsSec: hardened ? 3 : 2,
    concurrentFragmentsOverride: 1
  };
}

export function buildInstagramHeaderFallbacks(url: string): Array<Array<{ key: string; value: string }>> {
  const mobileUa =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
  const desktopUa =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

  const defaults: Array<Array<{ key: string; value: string }>> = [
    [
      { key: 'Referer', value: 'https://www.instagram.com/' },
      { key: 'Origin', value: 'https://www.instagram.com' },
      { key: 'User-Agent', value: desktopUa },
      { key: 'X-IG-App-ID', value: '936619743392459' }
    ],
    [
      { key: 'Referer', value: 'https://www.instagram.com/' },
      { key: 'Origin', value: 'https://www.instagram.com' },
      { key: 'User-Agent', value: mobileUa }
    ]
  ];

  try {
    const u = new URL(url);
    const origin = `${u.protocol}//${u.host}`;
    defaults.push([
      { key: 'Referer', value: `${origin}/` },
      { key: 'Origin', value: origin },
      { key: 'User-Agent', value: desktopUa }
    ]);
  } catch {
    // Keep default fallback headers only.
  }

  return defaults;
}

export function buildRefererFallbackHeaders(url: string): Array<Array<{ key: string; value: string }>> {
  try {
    const u = new URL(url);
    const origin = `${u.protocol}//${u.host}/`;
    return [
      [{ key: 'Referer', value: origin }],
      [{ key: 'Referer', value: url }],
      [
        { key: 'Referer', value: origin },
        { key: 'Origin', value: `${u.protocol}//${u.host}` }
      ]
    ];
  } catch {
    return [];
  }
}
