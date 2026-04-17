import { QUALITY_SELECTORS, QUALITY_SELECTORS_MP4_QUICKTIME } from '../constants.js';
import { resolveSocialCookieModes } from '../cookies.js';
import { runFlatAttemptDownload } from '../flatAttemptDownload.js';
import { buildRefererFallbackHeaders } from '../genericHeaders.js';
import type { DownloadFormat, DownloadQuality } from '../types.js';
import type { FlatDownloadAttempt, FlatDownloadInput } from './types.js';

export function buildTiktokFlatAttempts(url: string, format: DownloadFormat, quality: DownloadQuality): FlatDownloadAttempt[] {
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
    { strategyName: 'fast_primary', selector, hardened: false, cookiesMode: primaryCookiesMode },
    { strategyName: 'selector_fallback', selector: selectorFallback, hardened: true, cookiesMode: primaryCookiesMode }
  ];

  const refererAttempts = buildRefererFallbackHeaders(url);
  for (let i = 0; i < refererAttempts.length; i++) {
    attempts.push({
      strategyName: `referer_fallback_${i + 1}`,
      selector: selectorFallback,
      hardened: true,
      cookiesMode: primaryCookiesMode,
      extraHeaders: refererAttempts[i]
    });
  }
  for (const mode of cookieModes) {
    if (mode === primaryCookiesMode) continue;
    attempts.push({
      strategyName: `cookie_fallback_${mode}`,
      selector: selectorFallback,
      hardened: true,
      cookiesMode: mode
    });
  }

  return attempts;
}

export async function downloadTiktokStrategy(input: FlatDownloadInput): Promise<{
  filePath: string;
  mimeType: string;
  ext: string;
}> {
  const attempts = buildTiktokFlatAttempts(input.url, input.format, input.quality);
  return runFlatAttemptDownload({ ...input, provider: 'tiktok' }, attempts, { useInstagramBackoff: false });
}
