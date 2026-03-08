/**
 * URL ingestion for batch creation: normalize and dedupe.
 * Ensures we don't create duplicate item jobs for the same media.
 */

import { normalizeUrlForResolver } from './sourceResolver.js';

/**
 * Normalize a single URL for dedupe (lowercase host, strip trailing slash, sort query).
 * Returns null if invalid.
 */
export function normalizeUrlForIngestion(raw: string): string | null {
  const url = normalizeUrlForResolver(raw);
  if (!url) return null;
  try {
    const u = new URL(url);
    u.hostname = u.hostname.toLowerCase();
    u.pathname = u.pathname.replace(/\/+$/, '') || '/';
    u.searchParams.sort();
    return u.toString();
  } catch {
    return url;
  }
}

export interface IngestionResult {
  /** Unique normalized URLs in order of first occurrence */
  urls: string[];
  /** Number of duplicates removed */
  duplicatesRemoved: number;
}

/**
 * Normalize and dedupe a list of URLs. Order preserved by first occurrence.
 */
export function normalizeAndDedupeUrls(rawUrls: string[]): IngestionResult {
  const seen = new Set<string>();
  const urls: string[] = [];
  let duplicatesRemoved = 0;

  for (const raw of rawUrls) {
    const normalized = normalizeUrlForIngestion(raw.trim());
    if (!normalized) continue;
    if (seen.has(normalized)) {
      duplicatesRemoved += 1;
      continue;
    }
    seen.add(normalized);
    urls.push(normalized);
  }

  return { urls, duplicatesRemoved };
}
