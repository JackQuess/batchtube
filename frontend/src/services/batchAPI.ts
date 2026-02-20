import { apiClient } from '../lib/apiClient';

const isSafari = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export interface BatchJobRequest {
  items: Array<{
    url: string;
    title?: string;
  }>;
  format: 'mp3' | 'mp4';
  quality?: 'best' | '720p' | '1080p' | '4k';
}

export interface BatchJobResponse {
  jobId: string;
}

export interface BatchJobStatus {
  state: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  result?: {
    batchStatus?: 'completed' | 'completed_with_errors';
    total: number;
    succeeded: number;
    failed: number;
    items?: Array<{
      id: number;
      title: string;
      thumbnail: string | null;
      provider?: string;
      status: 'success' | 'failed';
    }>;
    results: Array<{
      id: number;
      status: 'success' | 'failed';
      provider?: string;
      meta?: {
        title?: string;
      };
      fileName?: string | null;
      bytes?: number;
      error?: string;
    }>;
  };
}

interface BatchResponse {
  id: string;
}

interface BatchDetails {
  status: 'created' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
}

interface BatchItemsResponse {
  data: Array<{
    original_url: string;
    provider: string;
    status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
    error: string | null;
  }>;
}

export const batchAPI = {
  createJob: async (request: BatchJobRequest): Promise<BatchJobResponse> => {
    const formatToUse = request.format === 'mp4' ? (isSafari() ? 'mp4' : 'mp4') : 'mp3';

    const data = await apiClient<BatchResponse>('/v1/batches', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Batch download',
        urls: request.items.map((item) => item.url),
        auto_start: true,
        options: {
          format: formatToUse,
          quality: request.quality || '1080p',
          archive_as_zip: true
        }
      })
    });

    return { jobId: data.id };
  },

  getStatus: async (jobId: string): Promise<BatchJobStatus> => {
    const [batch, itemsPayload] = await Promise.all([
      apiClient<BatchDetails>(`/v1/batches/${jobId}`),
      apiClient<BatchItemsResponse>(`/v1/batches/${jobId}/items?page=1&limit=200`)
    ]);

    const items = Array.isArray(itemsPayload?.data) ? itemsPayload.data : [];

    const stateMap: Record<string, BatchJobStatus['state']> = {
      created: 'waiting',
      queued: 'waiting',
      processing: 'active',
      completed: 'completed',
      failed: 'failed',
      cancelled: 'failed'
    };
    const state = stateMap[batch.status] || 'waiting';

    const normalizedItems = items.map((item, index) => {
      const failed = item.status === 'failed' || item.status === 'cancelled';
      return {
        id: index + 1,
        status: failed ? 'failed' : item.status === 'completed' ? 'success' : 'failed',
        provider: item.provider,
        meta: {
          title: item.original_url
        },
        error: item.error || undefined
      };
    });

    const succeeded = normalizedItems.filter((i) => i.status === 'success').length;
    const failed = normalizedItems.filter((i) => i.status === 'failed').length;

    return {
      state,
      progress: typeof batch.progress === 'number' ? batch.progress : 0,
      result: {
        batchStatus: failed > 0 && succeeded > 0 ? 'completed_with_errors' : 'completed',
        total: normalizedItems.length,
        succeeded,
        failed,
        items: normalizedItems.map((r) => ({
          id: r.id,
          title: r.meta?.title || `Item ${r.id}`,
          thumbnail: null,
          provider: r.provider,
          status: r.status
        })),
        results: normalizedItems
      }
    };
  },

  getSignedDownloadUrl: async (jobId: string): Promise<string> => {
    const data = await apiClient<{ url: string }>(`/v1/batches/${jobId}/zip`);
    return data.url;
  }
};
