import { VideoResult, VideoFormat, SelectionItem, JobProgressResponse } from '../types';
import { API_BASE_URL } from '../constants';

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

const normalizeVideoResult = (item: any): VideoResult | null => {
  const id =
    normalizeText(item?.id) ||
    normalizeText(item?.videoId) ||
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
    normalizeText(item?.videoTitle);
  const channel =
    normalizeText(item?.channel) ||
    normalizeText(item?.channelName) ||
    normalizeText(item?.uploader) ||
    normalizeText(item?.ownerChannelName) ||
    normalizeText(item?.author) ||
    normalizeText(item?.author_name);
  const thumbnail =
    normalizeText(item?.thumbnail) ||
    normalizeText(item?.thumbnail_url) ||
    getThumbnailFromList(item?.thumbnails);
  const duration = normalizeDuration(
    item?.duration ??
    item?.lengthText ??
    item?.length ??
    item?.durationSeconds ??
    item?.lengthSeconds ??
    item?.duration_string
  );

  return {
    id,
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
      headers: { 'Content-Type': 'application/json' }
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: payload })
    });
    if (!res.ok) throw new Error('Failed to start batch');
    return res.json();
  },

  getJobProgress: async (jobId: string): Promise<JobProgressResponse> => {
    const res = await fetch(`${apiBase}/progress/${jobId}`);
    if (!res.ok) throw new Error('Progress check failed');
    return res.json();
  },

  getDownloadUrl: (jobId: string) => {
    return `${apiBase}/download-file/${jobId}`;
  }
};
