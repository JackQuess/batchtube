/**
 * Provider display: names, icons, colors from PROVIDER_CATALOG.
 * Single source for SmartBar previews, chips, Supported Sites, and hint text.
 */

import type { ComponentType } from 'react';
import {
  Youtube,
  Video,
  Music,
  Tv,
  MessageCircle,
  Link2,
  Facebook,
  Instagram,
  Twitter,
  type LucideIcon
} from 'lucide-react';
import { PROVIDER_CATALOG, type ProviderCategory } from '../providerCatalog';

const catalogById = new Map(PROVIDER_CATALOG.map((p) => [p.id, p]));

/** Display name for provider id. Uses catalog; fallback to formatted id. */
export function getProviderName(providerId: string): string {
  const entry = catalogById.get(providerId);
  return entry?.name ?? providerId.replace(/^./, (c) => c.toUpperCase());
}

/** Icon component for provider. Data-driven: explicit map for known ids, then by category. */
const ICON_BY_ID: Record<string, LucideIcon> = {
  youtube: Youtube,
  tiktok: Video,
  instagram: Instagram,
  twitter: Twitter,
  vimeo: Video,
  facebook: Facebook,
  reddit: MessageCircle,
  twitch: Tv,
  soundcloud: Music,
  mixcloud: Music,
  bandcamp: Music,
  dailymotion: Video,
  bilibili: Video,
  rutube: Video,
  okru: Video,
  vk: Video,
  pinterest: Video,
  linkedin: Video,
  tumblr: Video,
  '9gag': Video,
  streamable: Video,
  coub: Video,
  archive: Video,
  loom: Video,
  generic: Link2,
  m3u8: Link2
};

const ICON_BY_CATEGORY: Record<ProviderCategory, LucideIcon> = {
  video: Video,
  social: MessageCircle,
  audio: Music,
  other: Video,
  direct: Link2
};

export function getProviderIcon(providerId: string): LucideIcon {
  const byId = ICON_BY_ID[providerId];
  if (byId) return byId;
  const entry = catalogById.get(providerId);
  return (entry ? ICON_BY_CATEGORY[entry.category] : Video) as LucideIcon;
}

/** Tailwind classes for provider chip/badge (background and border). */
const COLOR_BY_ID: Record<string, string> = {
  youtube: 'bg-red-500/20 text-red-400 border-red-500/30',
  tiktok: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  instagram: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  twitter: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  vimeo: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  facebook: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  reddit: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  soundcloud: 'bg-orange-400/20 text-orange-300 border-orange-400/30',
  twitch: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  generic: 'bg-white/10 text-app-muted border-app-border'
};

const COLOR_BY_CATEGORY: Record<ProviderCategory, string> = {
  video: 'bg-red-500/20 text-red-400 border-red-500/30',
  social: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  audio: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  other: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  direct: 'bg-white/10 text-app-muted border-app-border'
};

export function getProviderColorClass(providerId: string): string {
  const byId = COLOR_BY_ID[providerId];
  if (byId) return byId;
  const entry = catalogById.get(providerId);
  return entry ? COLOR_BY_CATEGORY[entry.category] : COLOR_BY_ID.generic;
}

/** Small badge color (solid) for single-video thumbnail badge. */
const BADGE_SOLID_BY_ID: Record<string, string> = {
  youtube: 'bg-red-500',
  tiktok: 'bg-cyan-500',
  instagram: 'bg-pink-500',
  twitter: 'bg-sky-500',
  vimeo: 'bg-blue-500',
  soundcloud: 'bg-orange-400',
  generic: 'bg-app-muted'
};

export function getProviderBadgeSolidClass(providerId: string): string {
  return BADGE_SOLID_BY_ID[providerId] ?? BADGE_SOLID_BY_ID.generic;
}

/** A few popular providers to show in SmartBar hint (main UI). Full list in Supported Sites. */
export const POPULAR_PROVIDER_IDS = ['youtube', 'tiktok', 'instagram', 'twitter', 'vimeo'] as const;

/** Label list for hint, e.g. "YouTube, TikTok, Instagram & 25+ more" */
export function getSmartBarHintText(): string {
  const names = POPULAR_PROVIDER_IDS.map(getProviderName);
  const total = PROVIDER_CATALOG.filter((p) => p.id !== 'generic' && p.id !== 'm3u8').length;
  const rest = total - names.length;
  if (rest <= 0) return names.join(' • ');
  return `${names.join(' • ')} & ${rest}+ more`;
}

export { PROVIDER_CATALOG };
export type { ProviderEntry, ProviderCategory } from '../providerCatalog';
