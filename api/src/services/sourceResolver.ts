/**
 * SOURCE RESOLVER LAYER (backend part)
 * URL normalization, provider detection, and source-type inference from URL.
 * Does NOT run yt-dlp for download; used for validation and optional server-side resolution.
 * Listing items is in sourceList.ts (preview); actual download is in download.ts (Download Engine).
 */

import { detectProvider, isMediaUrlAllowed } from './providers.js';

export type SourceType = 'video' | 'playlist' | 'channel' | 'profile' | 'direct_media' | 'unsupported';

export interface ResolveResult {
  url: string;
  provider: string;
  sourceType: SourceType;
  allowed: boolean;
  reason?: string;
}

/**
 * Normalize input to a valid HTTP(S) URL or null.
 */
export function normalizeUrlForResolver(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const u = new URL(withProtocol);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Infer source type from URL path/query using heuristics. Data-driven from provider support.
 */
export function detectSourceTypeFromUrl(url: string): SourceType {
  const provider = detectProvider(url);
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    const search = u.search.toLowerCase();

    if (provider === 'youtube') {
      if (/[?&]list=([\w-]+)/i.test(search) || /\/playlist\?/i.test(url)) return 'playlist';
      if (/\/@[\w-]+/i.test(path) || /\/channel\/[\w-]+/i.test(path) || /\/c\/[\w-]+/i.test(path)) return 'channel';
      if (/\/watch\?/i.test(url) || path === '/watch' || u.hostname.includes('youtu.be')) return 'video';
    }
    if (provider === 'vimeo' && (/\/album\/|\/showcase\//i.test(path))) return 'playlist';
    if (provider === 'soundcloud' && /\/sets\//i.test(path)) return 'playlist';
    if (provider === 'soundcloud' && path !== '/' && path.length > 1 && !/\/sets\//i.test(path)) return 'profile';
    if (provider === 'tiktok' && /^\/@[\w.-]+\/?$/i.test(path.replace(/\/$/, ''))) return 'profile';
    if (provider === 'instagram' && /^\/[\w.]+\/?$/i.test(path.replace(/\/$/, '')) && !/^\/(p|reel)\//i.test(path)) return 'profile';

    return 'video';
  } catch {
    return 'unsupported';
  }
}

/**
 * Resolve input to provider + source type. Does not fetch metadata or list items.
 */
export function resolveSource(input: string): ResolveResult | null {
  const url = normalizeUrlForResolver(input);
  if (!url) return null;
  const validation = isMediaUrlAllowed(url);
  const provider = detectProvider(url);
  const sourceType = detectSourceTypeFromUrl(url);
  return {
    url,
    provider,
    sourceType,
    allowed: validation.ok,
    reason: validation.reason
  };
}
