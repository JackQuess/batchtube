/**
 * Adapter for fetching source (channel/playlist/profile) items.
 * Backend does not yet provide these endpoints; when it does, switch implementation here.
 *
 * REQUIRED BACKEND GAPS (for full UX):
 *
 * 1) GET /v1/sources/preview?url=...
 *    Query: url (string)
 *    Response: { title: string; thumbnail?: string; itemCount?: number; type: 'channel' | 'playlist' | 'profile' }
 *
 * 2) GET /v1/sources/items?url=...&type=channel|playlist|profile&page=1&limit=50
 *    Response: { data: Array<{ id: string; url: string; title: string; thumbnail?: string; duration?: string; publishedAt?: string }>; meta: { total: number } }
 *
 * Until then, the UI shows placeholders/skeletons and "Select items manually" can still open
 * the modal with empty state or a clear "Source listing not yet available" message.
 */

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

const BACKEND_HAS_SOURCE_ENDPOINTS = false; // Set to true once API adds the routes

export async function fetchSourcePreview(_url: string, _type: 'channel' | 'playlist' | 'profile'): Promise<SourcePreviewMeta | null> {
  if (!BACKEND_HAS_SOURCE_ENDPOINTS) {
    return null;
  }
  // TODO: call GET /v1/sources/preview?url=...
  return null;
}

export async function fetchSourceItems(
  url: string,
  type: 'channel' | 'playlist' | 'profile',
  options: { page?: number; limit?: number } = {}
): Promise<SourceItemsResponse> {
  const { page = 1, limit = 50 } = options;
  if (!BACKEND_HAS_SOURCE_ENDPOINTS) {
    return { data: [], meta: { total: 0 } };
  }
  // TODO: call GET /v1/sources/items?url=...&type=...&page=...&limit=...
  return { data: [], meta: { total: 0 } };
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
