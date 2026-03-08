/**
 * Download cache: reuse existing file for same provider+sourceId+format+quality.
 * Avoids re-downloading when the same media was already fetched (e.g. same URL in multiple batches).
 */

import { createHash } from 'node:crypto';
import { prisma } from './db.js';

export function extractSourceId(provider: string, url: string): string | null {
  try {
    const u = new URL(url);
    const p = provider.toLowerCase();
    if (p === 'youtube') {
      const v = u.searchParams.get('v') ?? (u.hostname === 'youtu.be' ? u.pathname.slice(1).split('/')[0] : null);
      return v ?? url;
    }
    if (p === 'vimeo') {
      const m = u.pathname.match(/\/video\/(\d+)/);
      return m ? m[1]! : url;
    }
    if (p === 'tiktok' || p === 'instagram') {
      const segs = u.pathname.split('/').filter(Boolean);
      const last = segs[segs.length - 1];
      return last ?? url;
    }
    return url;
  } catch {
    return null;
  }
}

export function computeDownloadCacheKey(
  provider: string,
  sourceId: string,
  format: string,
  quality: string
): string {
  const payload = `${provider.toLowerCase()}:${sourceId}:${format}:${quality}`;
  return createHash('sha256').update(payload).digest('hex').slice(0, 64);
}

/**
 * Find a valid (non-expired) file with the given cache key. Used to reuse download.
 */
export async function findCachedFile(cacheKey: string): Promise<{
  storage_path: string;
  filename: string;
  file_size_bytes: bigint;
  mime_type: string | null;
  expires_at: Date;
} | null> {
  const file = await prisma.file.findFirst({
    where: {
      cache_key: cacheKey,
      expires_at: { gt: new Date() }
    },
    orderBy: { expires_at: 'desc' },
    select: {
      storage_path: true,
      filename: true,
      file_size_bytes: true,
      mime_type: true,
      expires_at: true
    }
  });
  return file;
}
