import type { ProviderName } from '../providerHealth.js';
import type { YoutubeErrorCode } from './types.js';

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function logYoutube(
  msg: string,
  extra: Record<string, unknown> & { itemId?: string; url?: string; batchId?: string | null }
): void {
  console.log(JSON.stringify({ msg, ...extra }));
}

export function sanitizeStderr(stderr: string, maxLen: number): string {
  const trimmed = stderr.trim();
  return trimmed.length > maxLen ? trimmed.slice(-maxLen) : trimmed;
}

export function toHealthProvider(provider?: string): ProviderName {
  const p = (provider ?? '').toLowerCase();
  if (p === 'youtube' || p === 'instagram' || p === 'tiktok' || p === 'vimeo' || p === 'direct') {
    return p;
  }
  return 'generic';
}

export function parseVersionDate(rawVersion: string): number | null {
  const cleaned = rawVersion.trim();
  const m = cleaned.match(/^(\d{4})\.(\d{2})\.(\d{2})/);
  if (!m) return null;
  return Number(`${m[1]}${m[2]}${m[3]}`);
}

export function isYoutubeRetriableCode(code: YoutubeErrorCode): boolean {
  return (
    code === 'youtube_transient' ||
    code === 'youtube_antibot' ||
    code === 'youtube_rate_limited' ||
    code === 'youtube_extractor_failure' ||
    code === 'youtube_unknown'
  );
}

export function isYoutubeAuthCode(code: YoutubeErrorCode): boolean {
  return code === 'youtube_login_required' || code === 'youtube_cookies_required';
}

export function isYoutubePermanentCode(code: YoutubeErrorCode): boolean {
  return code === 'youtube_private' || code === 'youtube_geo_restricted';
}

export function isGenericFailurePermanent(code: string, retriable: boolean): boolean {
  if (retriable) return false;
  if (code === 'provider_geo_restricted' || code === 'provider_source_unavailable' || code === 'provider_unsupported') {
    return true;
  }
  if (code === 'provider_auth_required') return true;
  return false;
}

/** Health counter: only hard failures (geo/private/auth), not exhausted-transient noise. */
export function isYoutubeHealthPermanentFailure(code: YoutubeErrorCode): boolean {
  if (isYoutubePermanentCode(code)) return true;
  if (isYoutubeAuthCode(code)) return true;
  return false;
}
