/**
 * SOURCE RESOLVER LAYER — listing only (preview).
 * List channel/playlist/profile entries using yt-dlp --flat-playlist (no download).
 * Errors here are PREVIEW/LISTING errors only. Do not use download error codes (e.g. youtube_age_restricted).
 */

import { spawn } from 'node:child_process';
import { isMediaUrlAllowed } from './providers.js';

const YT_DLP = 'yt-dlp';
const MAX_ENTRIES = 500;

export interface SourceListItem {
  id: string;
  url: string;
  title: string;
  thumbnail?: string | null;
  duration?: string | null;
  publishedAt?: string | null;
}

export interface ListSourceItemsResult {
  data: SourceListItem[];
  meta: { total: number };
}

function parseDuration(seconds: number | undefined | null): string | null {
  if (seconds == null || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export async function listSourceItems(
  url: string,
  _type: 'channel' | 'playlist' | 'profile',
  options: { page?: number; limit?: number } = {}
): Promise<ListSourceItemsResult> {
  const validation = isMediaUrlAllowed(url);
  if (!validation.ok) {
    throw new Error(validation.reason ?? 'URL not allowed');
  }

  const { page = 1, limit = 50 } = options;
  const end = Math.min(MAX_ENTRIES, page * limit);

  return new Promise((resolve, reject) => {
    const args = [
      '--flat-playlist',
      '-j',
      '--no-warnings',
      '--no-download',
      '--no-check-certificate',
      `--playlist-end`,
      String(end),
      url
    ];

    const proc = spawn(YT_DLP, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    proc.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });

    proc.on('error', (err) => {
      reject(new Error(`yt-dlp spawn failed: ${err.message}`));
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        // Do not forward raw yt-dlp stderr (may contain "Sign in to confirm" etc.) — keep as preview error only
        reject(new Error('LISTING_UNAVAILABLE'));
        return;
      }

      const lines = stdout.split('\n').filter((line) => line.trim());
      const raw: SourceListItem[] = [];

      for (const line of lines) {
        try {
          const obj = JSON.parse(line) as Record<string, unknown>;
          const id = (obj.id ?? obj.url ?? '') as string;
          if (!id) continue;
          const entryType = (obj._type ?? obj.type) as string | undefined;
          if (entryType === 'playlist' || entryType === 'playlist_video' || entryType === 'video' || !entryType) {
            const title = (obj.title ?? '') as string;
            let itemUrl = (obj.url ?? obj.webpage_url) as string | undefined;
            if (!itemUrl && id && !id.startsWith('http')) {
              if (url.includes('youtube') || url.includes('youtu.be')) {
                itemUrl = `https://www.youtube.com/watch?v=${id}`;
              } else {
                itemUrl = url.replace(/\/?$/, '/') + id;
              }
            }
            if (!itemUrl) continue;
            if (itemUrl === url) continue;
            const duration = (obj.duration ?? obj.duration_string) as number | string | undefined;
            const durationStr =
              typeof duration === 'number'
                ? parseDuration(duration)
                : typeof duration === 'string'
                  ? duration
                  : null;
            const thumbRaw = obj.thumbnail ?? (obj as { thumbnails?: Array<{ url?: string }> }).thumbnails?.[0]?.url;
            const thumb = thumbRaw as string | undefined;
            raw.push({
              id: itemUrl,
              url: itemUrl,
              title: title || 'Untitled',
              thumbnail: thumb ?? null,
              duration: durationStr ?? null,
              publishedAt: (obj.upload_date ?? obj.release_date) as string | undefined ?? null
            });
          }
        } catch {
          // skip invalid JSON lines
        }
      }

      const start = (page - 1) * limit;
      const data = raw.slice(start, start + limit);
      resolve({
        data,
        meta: { total: raw.length }
      });
    });
  });
}

const DISCOVERY_PAGE_SIZE = 50;
const MAX_ARCHIVE_ITEMS = 500;

/**
 * Fetch up to `maxItems` from a source using parallel page requests for speed.
 * Uses controlled concurrency (e.g. 5 parallel requests of 50 each = 250 items).
 */
export async function listSourceItemsParallel(
  url: string,
  type: 'channel' | 'playlist' | 'profile',
  maxItems: number
): Promise<SourceListItem[]> {
  const capped = Math.min(maxItems, MAX_ARCHIVE_ITEMS);
  const numPages = Math.ceil(capped / DISCOVERY_PAGE_SIZE);
  const pages = Array.from({ length: numPages }, (_, i) => i + 1);

  const results = await Promise.all(
    pages.map((page) =>
      listSourceItems(url, type, { page, limit: DISCOVERY_PAGE_SIZE })
    )
  );

  const seen = new Set<string>();
  const out: SourceListItem[] = [];
  for (const res of results) {
    for (const item of res.data) {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      out.push(item);
      if (out.length >= capped) return out;
    }
  }
  return out;
}
