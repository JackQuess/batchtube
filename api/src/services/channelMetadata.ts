/**
 * Fast channel/source metadata (title, thumbnail) and short TTL cache.
 * Used for instant "channel detected" response without full item listing.
 */

import { spawn } from 'node:child_process';
import { isMediaUrlAllowed } from './providers.js';

const YT_DLP = 'yt-dlp';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface ChannelMetadata {
  title: string;
  thumbnail: string | null;
  fetchedAt: number;
}

const cache = new Map<string, ChannelMetadata>();

function cacheKey(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.sort();
    return u.toString();
  } catch {
    return url;
  }
}

export function getCachedChannelMetadata(url: string): ChannelMetadata | null {
  const key = cacheKey(url);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry;
}

export function setCachedChannelMetadata(url: string, meta: { title: string; thumbnail: string | null }): void {
  cache.set(cacheKey(url), {
    title: meta.title,
    thumbnail: meta.thumbnail,
    fetchedAt: Date.now()
  });
}

/**
 * Fast resolve: one short yt-dlp call (--playlist-end 1) to get channel/playlist title and thumbnail.
 * Does not list all items. Use listSourceItems for that.
 */
export function getChannelMetadata(url: string): Promise<{ title: string; thumbnail: string | null }> {
  const validation = isMediaUrlAllowed(url);
  if (!validation.ok) {
    return Promise.reject(new Error(validation.reason ?? 'URL not allowed'));
  }

  const cached = getCachedChannelMetadata(url);
  if (cached) {
    return Promise.resolve({ title: cached.title, thumbnail: cached.thumbnail });
  }

  return new Promise((resolve, reject) => {
    const args = [
      '--flat-playlist',
      '-j',
      '--no-warnings',
      '--no-download',
      '--no-check-certificate',
      '--playlist-end',
      '1',
      url
    ];

    const proc = spawn(YT_DLP, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    proc.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    proc.stderr?.on('data', () => {});

    proc.on('error', (err) => reject(new Error(`yt-dlp spawn failed: ${err.message}`)));

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error('LISTING_UNAVAILABLE'));
        return;
      }

      const firstLine = stdout.split('\n').find((line) => line.trim());
      if (!firstLine) {
        resolve({ title: 'Channel', thumbnail: null });
        return;
      }

      try {
        const obj = JSON.parse(firstLine) as Record<string, unknown>;
        const title = (obj.title ?? obj.channel ?? obj.uploader ?? 'Channel') as string;
        const thumbRaw = obj.thumbnail ?? (obj as { thumbnails?: Array<{ url?: string }> }).thumbnails?.[0]?.url;
        const thumbnail = typeof thumbRaw === 'string' ? thumbRaw : null;
        const result = { title: title || 'Channel', thumbnail };
        setCachedChannelMetadata(url, result);
        resolve(result);
      } catch {
        resolve({ title: 'Channel', thumbnail: null });
      }
    });
  });
}
