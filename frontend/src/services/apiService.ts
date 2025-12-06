
import { VideoResult, VideoFormat, SelectionItem, BatchProgressResponse } from '../types';
import { API_BASE_URL } from '../config/api';

export const api = {
  search: async (query: string): Promise<VideoResult[]> => {
    // Use GET for search (faster)
    const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  startBatchDownload: async (items: SelectionItem[]) => {
    // Map to backend expected format
    const payload = items.map(item => ({
      url: `https://www.youtube.com/watch?v=${item.video.id}`,
      format: item.format || 'mp4',
      quality: item.quality || '1080p',
      title: item.video.title || 'Unknown'
    }));
    
    const res = await fetch(`${API_BASE_URL}/api/batch-download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: payload })
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Failed to start batch' }));
      throw new Error(error.error || 'Failed to start batch');
    }
    return res.json(); // { jobId }
  },

  getBatchProgress: async (jobId: string): Promise<BatchProgressResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/batch-progress/${jobId}`);
    if (!res.ok) throw new Error('Progress check failed');
    return res.json();
  },

  getDownloadUrl: (jobId: string) => {
    return `${API_BASE_URL}/api/download-file/${jobId}`;
  }
};
