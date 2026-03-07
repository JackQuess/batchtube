/**
 * Provider registry: domain detection and capabilities.
 * Aligns with backend API provider detection (api/src/services/providers.ts).
 * Use PROVIDER_CATALOG for display names/categories; this file is for URL→provider and capability flags.
 */

import { PROVIDER_CATALOG } from '../providerCatalog';

/** Domain rules matching backend DOMAIN_RULES. Order matters (first match wins). */
export const PROVIDER_DOMAIN_RULES: Array<{ id: string; regex: RegExp }> = [
  { id: 'youtube', regex: /(?:youtube\.com|youtu\.be)/i },
  { id: 'instagram', regex: /instagram\.com/i },
  { id: 'tiktok', regex: /tiktok\.com/i },
  { id: 'twitter', regex: /(?:twitter\.com|x\.com)/i },
  { id: 'facebook', regex: /(?:facebook\.com|fb\.watch|fb\.com)/i },
  { id: 'vimeo', regex: /vimeo\.com/i },
  { id: 'dailymotion', regex: /dailymotion\.com/i },
  { id: 'twitch', regex: /twitch\.tv/i },
  { id: 'reddit', regex: /reddit\.com/i },
  { id: 'soundcloud', regex: /soundcloud\.com/i },
  { id: 'mixcloud', regex: /mixcloud\.com/i },
  { id: 'bandcamp', regex: /bandcamp\.com/i },
  { id: 'bilibili', regex: /bilibili\.com/i },
  { id: 'rutube', regex: /rutube\.ru/i },
  { id: 'okru', regex: /ok\.ru/i },
  { id: 'vk', regex: /vk\.com/i },
  { id: 'pinterest', regex: /pinterest\./i },
  { id: 'linkedin', regex: /linkedin\.com/i },
  { id: 'tumblr', regex: /tumblr\.com/i },
  { id: '9gag', regex: /9gag\.com/i },
  { id: 'streamable', regex: /streamable\.com/i },
  { id: 'coub', regex: /coub\.com/i },
  { id: 'archive', regex: /archive\.org/i },
  { id: 'loom', regex: /loom\.com/i }
];

const CATALOG_IDS = new Set(PROVIDER_CATALOG.map((p) => p.id));

/**
 * Detect provider id from URL. Returns 'generic' if no rule matches.
 * Use this for all SmartBar detection so frontend matches backend.
 */
export function detectProvider(url: string): string {
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    const u = new URL(normalized);
    const host = u.hostname.toLowerCase();
    const path = u.pathname;
    const search = u.search;
    const full = `${host}${path}${search}`;
    for (const { id, regex } of PROVIDER_DOMAIN_RULES) {
      if (regex.test(host) || regex.test(full)) return id;
    }
  } catch {
    // invalid url
  }
  return 'generic';
}

/** Providers that support channel/playlist/profile URLs (not just single media). Others are single-only. */
export const PROVIDER_CAPABILITIES: Record<
  string,
  { channel?: boolean; playlist?: boolean; profile?: boolean }
> = {
  youtube: { channel: true, playlist: true, profile: false },
  tiktok: { channel: false, playlist: false, profile: true },
  instagram: { channel: false, playlist: false, profile: true },
  twitter: { channel: false, playlist: false, profile: true },
  facebook: { channel: false, playlist: false, profile: true },
  vimeo: { channel: false, playlist: true, profile: false },
  soundcloud: { channel: false, playlist: true, profile: true },
  reddit: { channel: false, playlist: false, profile: true }
};

export function getProviderCapabilities(providerId: string): {
  supportsChannel: boolean;
  supportsPlaylist: boolean;
  supportsProfile: boolean;
} {
  const cap = PROVIDER_CAPABILITIES[providerId];
  return {
    supportsChannel: cap?.channel ?? false,
    supportsPlaylist: cap?.playlist ?? false,
    supportsProfile: cap?.profile ?? false
  };
}

/** Whether this provider is in the catalog (supported). */
export function isSupportedProvider(providerId: string): boolean {
  return providerId === 'generic' || CATALOG_IDS.has(providerId);
}
