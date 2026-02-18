import { VideoResult, VideoFormat, SelectionItem, JobProgressResponse } from '../types';
import { API_BASE_URL } from '../constants';
import { getAuthHeaders } from '../lib/auth';

const base = API_BASE_URL.replace(/\/+$/, '');
const apiBase = base.endsWith('/api') ? base : `${base}/api`;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isPlaceholder = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return normalized === 'unknown' || normalized === 'video' || normalized === 'n/a' || normalized === 'na';
};

const normalizeDuration = (value: unknown): string | null => {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) return null;
    if (value === 0) return '0:00';
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const secs = Math.floor(value % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  if (!isNonEmptyString(value)) return null;

  const trimmed = value.trim();
  if (isPlaceholder(trimmed)) return null;

  if (trimmed === '0:00' || trimmed === '0') return null;
  if (trimmed.toLowerCase().includes('line')) return null;

  if (trimmed.includes(':')) {
    return trimmed;
  }

  if (trimmed.startsWith('PT')) {
    const iso = trimmed.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (iso) {
      const hours = parseInt(iso[1] || '0', 10);
      const minutes = parseInt(iso[2] || '0', 10);
      const secs = parseInt(iso[3] || '0', 10);
      const total = hours * 3600 + minutes * 60 + secs;
      if (total === 0) return null;
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  const seconds = parseInt(trimmed, 10);
  if (Number.isNaN(seconds)) return null;

  if (seconds === 0) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const normalizeText = (value: unknown): string | undefined => {
  if (!isNonEmptyString(value)) return undefined;
  const trimmed = value.trim();
  if (isPlaceholder(trimmed)) return undefined;
  return trimmed;
};

const normalizePlatform = (value: unknown): string | undefined => {
  const normalized = normalizeText(value);
  if (!normalized) return undefined;
  return normalized.toLowerCase();
};

const toCanonicalUrl = (item: any, id: string): string | undefined => {
  const direct =
    normalizeText(item?.url) ||
    normalizeText(item?.webpage_url) ||
    normalizeText(item?.link) ||
    normalizeText(item?.href);
  if (direct) return direct;

  if (!id) return undefined;

  try {
    const maybeUrl = new URL(id);
    if (maybeUrl.protocol === 'http:' || maybeUrl.protocol === 'https:') {
      return maybeUrl.toString();
    }
  } catch {
    // Not a URL, continue.
  }

  return `https://www.youtube.com/watch?v=${id}`;
};

const extractVideoId = (value: unknown): string | undefined => {
  if (!isNonEmptyString(value)) return undefined;
  const raw = value.trim();
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (host.includes('youtu.be')) {
      const id = url.pathname.replace('/', '').trim();
      return id || undefined;
    }
    if (host.includes('youtube.com')) {
      const v = url.searchParams.get('v');
      if (v) return v;
      const parts = url.pathname.split('/').filter(Boolean);
      const shortsIndex = parts.indexOf('shorts');
      const embedIndex = parts.indexOf('embed');
      if (shortsIndex >= 0 && parts[shortsIndex + 1]) return parts[shortsIndex + 1];
      if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1];
    }
  } catch {
    // Fall through to regex parsing
  }
  const match = raw.match(/[?&]v=([^&]+)/) || raw.match(/youtu\.be\/([^?&]+)/) || raw.match(/youtube\.com\/shorts\/([^?&/]+)/);
  return match?.[1];
};

const getThumbnailFromList = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    const first = value.find(Boolean);
    if (typeof first === 'string') return normalizeText(first);
    if (typeof first === 'object' && first) {
      return normalizeText((first as any).url) || normalizeText((first as any).src);
    }
  }
  return undefined;
};

const getSnippetThumbnail = (snippet: any): string | undefined => {
  if (!snippet?.thumbnails) return undefined;
  const thumbs = snippet.thumbnails;
  return (
    normalizeText(thumbs.maxres?.url) ||
    normalizeText(thumbs.standard?.url) ||
    normalizeText(thumbs.high?.url) ||
    normalizeText(thumbs.medium?.url) ||
    normalizeText(thumbs.default?.url)
  );
};

const normalizeVideoResult = (item: any): VideoResult | null => {
  const id =
    normalizeText(item?.id) ||
    normalizeText(item?.id?.videoId) ||
    normalizeText(item?.id?.value) ||
    normalizeText(item?.videoId) ||
    normalizeText(item?.snippet?.resourceId?.videoId) ||
    extractVideoId(item?.url) ||
    extractVideoId(item?.webpage_url) ||
    extractVideoId(item?.link) ||
    extractVideoId(item?.href) ||
    '';
  if (!id) return null;

  const title =
    normalizeText(item?.title) ||
    normalizeText(item?.fulltitle) ||
    normalizeText(item?.name) ||
    normalizeText(item?.videoTitle) ||
    normalizeText(item?.snippet?.title);
  const channel =
    normalizeText(item?.channel) ||
    normalizeText(item?.channelName) ||
    normalizeText(item?.uploader) ||
    normalizeText(item?.ownerChannelName) ||
    normalizeText(item?.author) ||
    normalizeText(item?.author_name) ||
    normalizeText(item?.snippet?.channelTitle);
  const thumbnail =
    normalizeText(item?.thumbnail) ||
    normalizeText(item?.thumbnail_url) ||
    getThumbnailFromList(item?.thumbnails) ||
    getSnippetThumbnail(item?.snippet);
  const duration = normalizeDuration(
    item?.duration ??
    item?.lengthText ??
    item?.length ??
    item?.durationSeconds ??
    item?.lengthSeconds ??
    item?.duration_string ??
    item?.contentDetails?.duration
  );
  const url = toCanonicalUrl(item, id);

  return {
    id,
    url,
    platform: normalizePlatform(item?.platform),
    title,
    channel,
    thumbnail,
    duration,
    views: normalizeText(item?.views),
    description: normalizeText(item?.description),
    channelAvatar: normalizeText(item?.channelAvatar),
    publishedTime: normalizeText(item?.publishedTime)
  };
};

const coerceArray = (value: unknown): any[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const normalizeResults = (data: unknown): VideoResult[] => {
  let items: any[] = [];

  if (Array.isArray(data)) {
    items = data;
  } else if (data && typeof data === 'object') {
    const objectData = data as any;
    if (Array.isArray(objectData.items)) items = objectData.items;
    else if (Array.isArray(objectData.results)) items = objectData.results;
    else if (Array.isArray(objectData.entries)) items = objectData.entries;
    else if (Array.isArray(objectData.data)) items = objectData.data;
    else if (objectData.video) items = coerceArray(objectData.video);
    else if (objectData.item) items = coerceArray(objectData.item);
    else items = [objectData];
  }

  return items
    .map(normalizeVideoResult)
    .filter((item): item is VideoResult => item !== null);
};

export const api = {
  search: async (query: string): Promise<VideoResult[]> => {
    const res = await fetch(`${apiBase}/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    const normalized = normalizeResults(data);
    if (import.meta.env.DEV && normalized.length > 0) {
      console.debug('[apiService] normalized result', normalized[0]);
    }
    return normalized;
  },

  startSingleDownload: async (videoId: string, format: VideoFormat, title?: string) => {
    const res = await fetch(`${apiBase}/single`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        videoId,
        format,
        title,
        quality: 'best'
      })
    });
    if (!res.ok) throw new Error('Failed to start download');
    return res.json();
  },

  startBatchDownload: async (items: SelectionItem[], defaultFormat: VideoFormat) => {
    const payload = items.map(item => ({
      videoId: item.video.id,
      format: item.format || defaultFormat,
      title: item.video.title,
      quality: 'best'
    }));

    const res = await fetch(`${apiBase}/batch`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ items: payload })
    });
    if (!res.ok) throw new Error('Failed to start batch');
    return res.json();
  },

  getJobProgress: async (jobId: string): Promise<JobProgressResponse> => {
    const res = await fetch(`${apiBase}/progress/${jobId}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Progress check failed');
    return res.json();
  },

  getDownloadUrl: (jobId: string) => {
    return `${apiBase}/download-file/${jobId}`;
  }
};
