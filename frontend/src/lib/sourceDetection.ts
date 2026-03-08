/**
 * Source type detection layer for SmartBar.
 * Classifies input into: single_video | multiple_links | channel | playlist | profile | command | unsupported.
 * Rule-based only; uses provider registry for detection and capabilities.
 */

import { detectProvider as registryDetectProvider, getProviderCapabilities } from './providerRegistry';

export type SourceType =
  | 'single_video'
  | 'multiple_links'
  | 'channel'
  | 'playlist'
  | 'profile'
  | 'command'
  | 'unsupported';

export interface DetectionResult {
  type: SourceType;
  raw: string;
  /** For single_video */
  url?: string;
  provider?: string;
  /** For multiple_links */
  items?: Array<{ url: string; provider: string; normalizedUrl: string; sourceType?: 'video' | 'playlist' | 'channel' | 'profile' }>;
  validCount?: number;
  invalidCount?: number;
  invalidUrls?: string[];
  duplicateCount?: number;
  uniqueUrls?: string[];
  providerCounts?: Record<string, number>;
  /** For channel | playlist | profile */
  sourceUrl?: string;
  sourceLabel?: string;
  /** For command */
  commandRaw?: string;
  suggestions?: Array<{ id: string; label: string; description: string; action: string; payload?: string }>;
  /** Extracted "latest N" from command if present */
  latestN?: number;
  /** Extracted source URL from command if present (e.g. "latest 20 from youtube.com/@x") */
  commandSourceUrl?: string;
  /** For archive command: mode and optional latest N */
  archiveMode?: 'latest_25' | 'latest_n' | 'all' | 'select';
  archiveLatestN?: number;
}

function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    if (!/^https?:\/\//i.test(trimmed)) {
      return new URL(`https://${trimmed}`).toString();
    }
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

function getHost(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function detectProvider(url: string): string {
  return registryDetectProvider(url);
}

function isVideoUrl(url: string): boolean {
  const path = new URL(url).pathname.toLowerCase();
  const provider = detectProvider(url);
  const cap = getProviderCapabilities(provider);
  if (cap.supportsChannel || cap.supportsPlaylist || cap.supportsProfile) {
    if (provider === 'youtube') {
      const host = getHost(url);
      if (host === 'youtu.be') return true;
      if (/\/watch\?/i.test(url) || path === '/watch') return true;
    }
    if (provider === 'tiktok' && /\/video\/|\/@[\w.-]+\/video\//i.test(url)) return true;
    if (provider === 'instagram' && /\/(p|reel)\//i.test(path)) return true;
    if (provider === 'twitter' && /\/status\//i.test(path)) return true;
    if (provider === 'vimeo' && /^\/(\d+)$/.test(path)) return true;
    if (provider === 'facebook') return true;
    if (provider === 'reddit' && /\/comments\//i.test(path)) return true;
    if (provider === 'soundcloud' && path !== '/' && path.length > 1) return true;
  }
  return true;
}

function isPlaylistUrl(url: string): boolean {
  const provider = detectProvider(url);
  if (!getProviderCapabilities(provider).supportsPlaylist) return false;
  if (provider === 'youtube' && (/list=([\w-]+)/i.test(url) || /\/playlist\?/i.test(url))) return true;
  if (provider === 'vimeo' && /\/album\/|\/showcase\//i.test(url)) return true;
  if (provider === 'soundcloud' && /\/sets\//i.test(url)) return true;
  return false;
}

function isChannelUrl(url: string): boolean {
  const provider = detectProvider(url);
  if (!getProviderCapabilities(provider).supportsChannel) return false;
  const path = new URL(url).pathname.toLowerCase();
  if (provider === 'youtube' && (/\/@[\w-]+/i.test(path) || /\/channel\/[\w-]+/i.test(path) || /\/c\/[\w-]+/i.test(path))) return true;
  return false;
}

function isProfileUrl(url: string): boolean {
  const provider = detectProvider(url);
  if (!getProviderCapabilities(provider).supportsProfile) return false;
  const path = new URL(url).pathname.toLowerCase().replace(/\/$/, '');
  if (provider === 'tiktok' && /^\/@[\w.-]+\/?$/i.test(path)) return true;
  if (provider === 'instagram' && /^\/[\w.]+\/?$/i.test(path) && !/^\/(p|reel)\//i.test(path)) return true;
  if (provider === 'twitter' && path.split('/').filter(Boolean).length === 1 && !path.includes('status')) return true;
  if (provider === 'facebook' && path.length > 1 && !/\/video\/|\/reel\//i.test(path)) return true;
  if (provider === 'reddit' && /^\/user\/[\w-]+\/?$/i.test(path)) return true;
  if (provider === 'soundcloud' && /^\/[\w-]+\/?$/i.test(path) && !/\/sets\//i.test(path)) return true;
  return false;
}

export function classifySingleUrl(url: string): 'single_video' | 'playlist' | 'channel' | 'profile' | 'unsupported' {
  const normalized = normalizeUrl(url);
  if (!normalized) return 'unsupported';
  const provider = detectProvider(normalized);
  if (provider === 'generic') return 'single_video'; // direct link
  if (isPlaylistUrl(normalized)) return 'playlist';
  if (isChannelUrl(normalized)) return 'channel';
  if (isProfileUrl(normalized)) return 'profile';
  if (isVideoUrl(normalized)) return 'single_video';
  return 'single_video';
}

// Command grammar: "archive url", "download url", "batch url1 url2", "extract audio url", "latest N from url"
const CMD_PREFIXES = [
  { prefix: 'archive', action: 'archive' },
  { prefix: 'download', action: 'download' },
  { prefix: 'batch', action: 'batch' },
  { prefix: 'extract audio', action: 'extract_audio' },
  { prefix: 'history', action: 'history' },
  { prefix: 'files', action: 'files' }
];

const LATEST_FROM_RE = /latest\s+(\d+)\s+from\s+(.+)/i;

export function parseCommand(input: string): DetectionResult | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) return null;

  const suggestions: DetectionResult['suggestions'] = [];

  // "latest N from <url>"
  const latestMatch = trimmed.match(LATEST_FROM_RE);
  if (latestMatch) {
    const n = Math.min(100, Math.max(1, parseInt(latestMatch[1]!, 10)));
    const rest = latestMatch[2]!.trim();
    const url = rest.startsWith('http') ? rest : normalizeUrl(`https://${rest}`);
    if (url) {
      return {
        type: 'command',
        raw: trimmed,
        latestN: n,
        commandSourceUrl: url,
        commandRaw: trimmed,
        suggestions: [
          { id: 'latest', label: `Download latest ${n}`, description: `Create batch with latest ${n} items from source`, action: 'latest', payload: url }
        ]
      };
    }
  }

  for (const { prefix, action } of CMD_PREFIXES) {
    if (trimmed.startsWith(prefix)) {
      const rest = trimmed.slice(prefix.length).trim();
      let url: string | null = null;
      let archiveMode: DetectionResult['archiveMode'] = 'latest_25';
      let archiveLatestN: number | undefined;

      if (rest) {
        const archiveLatestMatch = rest.match(/\b--latest\s+(\d+)\b/i);
        const hasAll = /\b--all\b/i.test(rest);
        const hasSelect = /\b--select\b/i.test(rest);
        let urlPart = rest
          .replace(/\s*--latest\s+\d+\s*/gi, ' ')
          .replace(/\s*--all\s*/gi, ' ')
          .replace(/\s*--select\s*/gi, ' ')
          .trim();
        url = urlPart.startsWith('http') ? urlPart : normalizeUrl(`https://${urlPart}`);
        if (hasAll) archiveMode = 'all';
        else if (hasSelect) archiveMode = 'select';
        else if (archiveLatestMatch) {
          archiveMode = 'latest_n';
          archiveLatestN = Math.min(500, Math.max(1, parseInt(archiveLatestMatch[1]!, 10)));
        }
      }

      suggestions.push({
        id: action,
        label: action === 'extract_audio' ? 'Extract audio' : action.charAt(0).toUpperCase() + action.slice(1),
        description: action === 'history' ? 'Open recent downloads' : action === 'files' ? 'Open files' : url ? `Run ${action} on link` : `Run ${action}`,
        action,
        payload: url || undefined
      });
      return {
        type: 'command',
        raw: trimmed,
        commandRaw: trimmed,
        commandSourceUrl: url || undefined,
        suggestions,
        ...(action === 'archive' && { archiveMode, archiveLatestN })
      };
    }
  }

  return null;
}

export function detectSource(raw: string): DetectionResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { type: 'unsupported', raw: trimmed };
  }

  const lines = trimmed.split(/[\r\n,]+/).map((s) => s.trim()).filter(Boolean);

  // Multiple lines/blocks => multiple_links
  if (lines.length > 1) {
    const seen = new Set<string>();
    const invalidUrls: string[] = [];
    const items: DetectionResult['items'] = [];
    let duplicateCount = 0;
    const providerCounts: Record<string, number> = {};

    for (const line of lines) {
      const url = normalizeUrl(line);
      if (!url) {
        invalidUrls.push(line);
        continue;
      }
      if (seen.has(url)) {
        duplicateCount++;
        continue;
      }
      seen.add(url);
      const provider = detectProvider(url);
      const sourceType = isPlaylistUrl(url) ? 'playlist' : isChannelUrl(url) ? 'channel' : isProfileUrl(url) ? 'profile' : 'video';
      items.push({ url, provider, normalizedUrl: url, sourceType });
      providerCounts[provider] = (providerCounts[provider] || 0) + 1;
    }

    const uniqueUrls = items.map((i) => i.url);
    return {
      type: 'multiple_links',
      raw: trimmed,
      items,
      validCount: items.length,
      invalidCount: invalidUrls.length,
      invalidUrls,
      duplicateCount,
      uniqueUrls,
      providerCounts
    };
  }

  const single = lines[0]!;

  // Command: line starts with command keyword (or "latest N from")
  if (/^\s*(archive|download|batch|extract\s+audio|history|files|latest\s+\d+\s+from)\b/i.test(single)) {
    const cmd = parseCommand(single);
    if (cmd) return cmd;
  }

  // Single URL
  const url = single.startsWith('http') || (single.includes('.') && single.includes('/')) ? normalizeUrl(single) : null;
  if (!url) {
    return { type: 'unsupported', raw: trimmed };
  }

  const kind = classifySingleUrl(url);
  const provider = detectProvider(url);

  if (kind === 'playlist') {
    return {
      type: 'playlist',
      raw: trimmed,
      sourceUrl: url,
      sourceLabel: 'Playlist',
      provider
    };
  }
  if (kind === 'channel') {
    return {
      type: 'channel',
      raw: trimmed,
      sourceUrl: url,
      sourceLabel: 'Channel',
      provider
    };
  }
  if (kind === 'profile') {
    return {
      type: 'profile',
      raw: trimmed,
      sourceUrl: url,
      sourceLabel: 'Profile',
      provider
    };
  }
  if (kind === 'single_video') {
    return {
      type: 'single_video',
      raw: trimmed,
      url,
      provider
    };
  }

  return { type: 'unsupported', raw: trimmed };
}
