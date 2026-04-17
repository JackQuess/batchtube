import { QUALITY_SELECTORS, QUALITY_SELECTORS_MP4_QUICKTIME } from '../constants.js';
import { resolveSocialCookieModes } from '../cookies.js';
import { runFlatAttemptDownload } from '../flatAttemptDownload.js';
import { buildInstagramHeaderFallbacks, buildRefererFallbackHeaders, ytDlpInstagramThrottleOptions } from '../genericHeaders.js';
import type { DownloadFormat, DownloadQuality } from '../types.js';
import type { FlatDownloadAttempt, FlatDownloadInput } from './types.js';

export function buildInstagramFlatAttempts(url: string, format: DownloadFormat, quality: DownloadQuality): FlatDownloadAttempt[] {
  const selector =
    format === 'mp4'
      ? QUALITY_SELECTORS_MP4_QUICKTIME[quality]
      : format === 'jpg'
        ? 'best'
        : QUALITY_SELECTORS[quality];
  const selectorFallback = format === 'jpg' ? 'best' : 'bv*+ba/b';
  const cookieModes = resolveSocialCookieModes();
  const primaryCookiesMode = cookieModes[0] ?? 'none';

  const attempts: FlatDownloadAttempt[] = [
    {
      strategyName: 'fast_primary',
      selector,
      hardened: false,
      cookiesMode: primaryCookiesMode,
      ...ytDlpInstagramThrottleOptions(false)
    },
    {
      strategyName: 'selector_fallback',
      selector: selectorFallback,
      hardened: true,
      cookiesMode: primaryCookiesMode,
      ...ytDlpInstagramThrottleOptions(true)
    }
  ];

  const refererAttempts = buildRefererFallbackHeaders(url);
  for (let i = 0; i < refererAttempts.length; i++) {
    attempts.push({
      strategyName: `referer_fallback_${i + 1}`,
      selector: selectorFallback,
      hardened: true,
      cookiesMode: primaryCookiesMode,
      extraHeaders: refererAttempts[i],
      ...ytDlpInstagramThrottleOptions(true)
    });
  }
  for (const mode of cookieModes) {
    if (mode === primaryCookiesMode) continue;
    attempts.push({
      strategyName: `cookie_fallback_${mode}`,
      selector: selectorFallback,
      hardened: true,
      cookiesMode: mode,
      ...ytDlpInstagramThrottleOptions(true)
    });
  }

  const instagramHeaderAttempts = buildInstagramHeaderFallbacks(url);
  for (let i = 0; i < instagramHeaderAttempts.length; i++) {
    attempts.push({
      strategyName: `instagram_header_fallback_${i + 1}`,
      selector: selectorFallback,
      hardened: true,
      cookiesMode: primaryCookiesMode,
      extraHeaders: instagramHeaderAttempts[i],
      ...ytDlpInstagramThrottleOptions(true)
    });
  }

  return attempts;
}

export async function downloadInstagramStrategy(input: FlatDownloadInput): Promise<{
  filePath: string;
  mimeType: string;
  ext: string;
}> {
  const attempts = buildInstagramFlatAttempts(input.url, input.format, input.quality);
  return runFlatAttemptDownload({ ...input, provider: 'instagram' }, attempts, { useInstagramBackoff: true });
}
