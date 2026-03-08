/**
 * Adapter for fetching source (channel/playlist/profile) items.
 * Uses GET /v1/sources/items when backend provides it.
 */

import { apiClient } from './apiClient';

export interface SourcePreviewMeta {
  title: string;
  thumbnail?: string | null;
  itemCount?: number | null;
  type: 'channel' | 'playlist' | 'profile';
}

export interface SourceItem {
  id: string;
  url: string;
  title: string;
  thumbnail?: string | null;
  duration?: string | null;
  publishedAt?: string | null;
  provider?: string;
}

export interface SourceItemsResponse {
  data: SourceItem[];
  meta: { total: number };
}

export async function fetchSourcePreview(_url: string, _type: 'channel' | 'playlist' | 'profile'): Promise<SourcePreviewMeta | null> {
  // Optional: backend could add GET /v1/sources/preview for title/thumbnail/count only
  return null;
}

export async function fetchSourceItems(
  url: string,
  type: 'channel' | 'playlist' | 'profile',
  options: { page?: number; limit?: number } = {}
): Promise<SourceItemsResponse> {
  const { page = 1, limit = 50 } = options;
  const params = new URLSearchParams({
    url,
    type,
    page: String(page),
    limit: String(limit)
  });
  const res = await apiClient<SourceItemsResponse>(
    `/v1/sources/items?${params.toString()}`,
    { method: 'GET' },
    true
  );
  return res;
}

/** Fetch latest N item URLs for "Download latest N" flow. Uses fetchSourceItems when available. */
export async function fetchLatestItemUrls(
  url: string,
  type: 'channel' | 'playlist' | 'profile',
  n: number
): Promise<string[]> {
  const res = await fetchSourceItems(url, type, { page: 1, limit: n });
  return res.data.slice(0, n).map((item) => item.url);
}
