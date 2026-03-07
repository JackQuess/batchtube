/**
 * SmartBar input parser: URLs, channels, playlists, commands.
 * Rule-based; no AI. Reuses provider catalog for allowed hosts.
 */

import { PROVIDER_CATALOG } from '../providerCatalog';
import { detectProvider as registryDetectProvider } from './providerRegistry';

export type InputKind = 'single' | 'multi' | 'channel' | 'playlist' | 'profile' | 'command' | 'invalid';

export interface ParsedSingle {
  kind: 'single';
  url: string;
  provider: string;
  normalizedUrl: string;
}

export interface ParsedMulti {
  kind: 'multi';
  items: Array<{ url: string; provider: string; normalizedUrl: string }>;
  validCount: number;
  invalidCount: number;
  invalidUrls: string[];
  duplicateCount: number;
  uniqueUrls: string[];
}

export interface ParsedChannel {
  kind: 'channel' | 'playlist' | 'profile';
  url: string;
  provider: string;
  normalizedUrl: string;
  label: string;
}

export interface CommandSuggestion {
  id: string;
  label: string;
  description: string;
  action: 'download' | 'batch' | 'extract_audio' | 'archive' | 'history' | 'files';
  payload?: string;
}

export interface ParsedCommand {
  kind: 'command';
  raw: string;
  suggestions: CommandSuggestion[];
}

export type ParsedResult =
  | ParsedSingle
  | ParsedMulti
  | ParsedChannel
  | ParsedCommand
  | { kind: 'invalid'; raw: string };

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

function detectProvider(url: string): string {
  return registryDetectProvider(url);
}

function isAllowedMediaUrl(url: string): boolean {
  const provider = detectProvider(url);
  if (provider === 'generic') return true;
  const entry = PROVIDER_CATALOG.find((p) => p.id === provider);
  return Boolean(entry);
}

export function parseSingleInput(raw: string): ParsedSingle | null {
  const url = normalizeUrl(raw);
  if (!url) return null;
  return {
    kind: 'single',
    url,
    provider: detectProvider(url),
    normalizedUrl: url
  };
}

export function parseMultiInput(raw: string): ParsedMulti {
  const lines = raw
    .split(/[\r\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const invalidUrls: string[] = [];
  const items: Array<{ url: string; provider: string; normalizedUrl: string }> = [];
  let duplicateCount = 0;

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
    items.push({
      url,
      provider: detectProvider(url),
      normalizedUrl: url
    });
  }

  const uniqueUrls = items.map((i) => i.url);
  return {
    kind: 'multi',
    items,
    validCount: items.length,
    invalidCount: invalidUrls.length,
    invalidUrls,
    duplicateCount,
    uniqueUrls
  };
}

const CHANNEL_PATTERNS = [
  { re: /youtube\.com\/@[\w-]+/i, provider: 'youtube', label: 'YouTube channel' },
  { re: /youtube\.com\/channel\/[\w-]+/i, provider: 'youtube', label: 'YouTube channel' },
  { re: /youtube\.com\/playlist\?list=[\w-]+/i, provider: 'youtube', label: 'YouTube playlist' },
  { re: /tiktok\.com\/@[\w.-]+\/?$/i, provider: 'tiktok', label: 'TikTok profile' },
  { re: /instagram\.com\/[\w.]+\/?$/i, provider: 'instagram', label: 'Instagram profile' }
];

export function parseChannelLikeInput(raw: string): ParsedChannel | null {
  const url = normalizeUrl(raw);
  if (!url) return null;
  const lower = url.toLowerCase();
  for (const { re, provider, label } of CHANNEL_PATTERNS) {
    if (re.test(lower)) {
      return {
        kind: label.includes('channel') ? 'channel' : label.includes('playlist') ? 'playlist' : 'profile',
        url,
        provider,
        normalizedUrl: url,
        label
      };
    }
  }
  return null;
}

const COMMAND_PREFIXES = [
  { prefix: 'archive', action: 'archive' as const },
  { prefix: 'download', action: 'download' as const },
  { prefix: 'batch', action: 'batch' as const },
  { prefix: 'extract audio', action: 'extract_audio' as const },
  { prefix: 'history', action: 'history' as const },
  { prefix: 'files', action: 'files' as const }
];

export function parseCommandInput(raw: string): ParsedCommand | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) return null;
  const suggestions: CommandSuggestion[] = [];

  for (const { prefix, action } of COMMAND_PREFIXES) {
    if (trimmed.startsWith(prefix) || prefix.startsWith(trimmed)) {
      suggestions.push({
        id: action,
        label: action === 'extract_audio' ? 'Extract audio' : action.charAt(0).toUpperCase() + action.slice(1),
        description: action === 'history' ? 'Open recent downloads' : action === 'files' ? 'Open files' : `Run ${action}`,
        action
      });
    }
  }

  if (suggestions.length === 0) {
    suggestions.push(
      { id: 'download', label: 'Download', description: 'Download from URL', action: 'download' },
      { id: 'batch', label: 'Batch', description: 'Create batch from multiple URLs', action: 'batch' },
      { id: 'archive', label: 'Archive channel', description: 'Download entire channel', action: 'archive' }
    );
  }

  return {
    kind: 'command',
    raw: trimmed,
    suggestions
  };
}

export function parseSmartBarInput(raw: string): ParsedResult | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const lines = trimmed.split(/[\r\n,]+/).map((s) => s.trim()).filter(Boolean);

  if (lines.length > 1) {
    const multi = parseMultiInput(trimmed);
    if (multi.validCount > 0) return multi;
    return { kind: 'invalid', raw: trimmed };
  }

  const single = lines[0]!;
  if (single.startsWith('http') || single.includes('.') && single.includes('/')) {
    const channel = parseChannelLikeInput(single);
    if (channel) return channel;
    const one = parseSingleInput(single);
    if (one) return one;
    return { kind: 'invalid', raw: trimmed };
  }

  const cmd = parseCommandInput(single);
  if (cmd && cmd.suggestions.length > 0) return cmd;

  return null;
}
