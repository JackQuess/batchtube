import { VideoResult, VideoFormat, SelectionItem, BatchProgressResponse, JobProgressResponse } from '../types';
import { API_BASE_URL } from '../config/api';

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isPlaceholder = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return normalized === 'unknown' || normalized === 'video' || normalized === 'n/a' || normalized === 'na';
};

const normalizeDuration = (value: unknown): string | null => {
  if (!isNonEmptyString(value)) return null;

  const trimmed = value.trim();
  if (isPlaceholder(trimmed)) return null;

  if (trimmed === '0:00') return null;

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

const normalizeVideoResult = (item: any): VideoResult | null => {
  const id = normalizeText(item?.id) || normalizeText(item?.videoId) || '';
  if (!id) return null;

  const title = normalizeText(item?.title);
  const channel = normalizeText(item?.channel) || normalizeText(item?.author_name);
  const thumbnail = normalizeText(item?.thumbnail) || normalizeText(item?.thumbnail_url);
  const duration = normalizeDuration(item?.duration ?? item?.lengthText ?? item?.length);

  return {
    id,
    title,
    channel,
    thumbnail,
    duration,
    views: normalizeText(item?.views),
    description: normalizeText(item?.description),
  };
};

const normalizeResults = (data: unknown): VideoResult[] => {
  if (!Array.isArray(data)) return [];
  return data
    .map(normalizeVideoResult)
    .filter((item): item is VideoResult => item !== null);
};

export const api = {
  search: async (query: string): Promise<VideoResult[]> => {
    const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    return normalizeResults(data);
  },

  startBatchDownload: async (items: SelectionItem[]) => {
    const payload = items.map(item => ({
      url: `https://www.youtube.com/watch?v=${item.video.id}`,
      format: item.format || 'mp4',
      quality: item.quality || '1080p',
      title: item.video.title || 'Unknown'
    }));

    const res = await fetch(`${API_BASE_URL}/api/batch-download`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: payload })
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Failed to start batch' }));
      throw new Error(error.error || 'Failed to start batch');
    }
    return res.json();
  },

  getBatchProgress: async (jobId: string): Promise<BatchProgressResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/batch-progress/${jobId}`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Progress check failed');
    return res.json();
  },


  getJobProgress: async (jobId: string): Promise<JobProgressResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/progress/${jobId}`);
    if (!res.ok) throw new Error('Progress check failed');
    return res.json();
  },

  getDownloadUrl: (jobId: string) => {
    return `${API_BASE_URL}/api/download-file/${jobId}`;
  }
};
