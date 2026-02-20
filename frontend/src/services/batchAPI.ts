/**
 * BatchTube 2.0 - Batch API Service
 * Clean API client for queue-based batch downloads
 */
import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from '../lib/auth';

const isSafari = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export interface BatchJobRequest {
  items: Array<{
    url: string;
    title?: string;
  }>;
  format: 'mp3' | 'mp4';
  quality?: '1080p' | '4k';
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
      meta?: {
        title?: string;
        channel?: string;
        durationSeconds?: number;
        thumbnail?: string;
      };
      status: 'success' | 'failed';
    }>;
    results: Array<{
      id: number;
      status: 'success' | 'failed';
      provider?: string;
      meta?: {
        title?: string;
        channel?: string;
        durationSeconds?: number;
        thumbnail?: string;
      };
      fileName?: string | null;
      bytes?: number;
      error?: string;
      errorCode?: string;
      hint?: string;
    }>;
  };
  error?: string;
}

export const batchAPI = {
  /**
   * Create a new batch download job
   */
  createJob: async (request: BatchJobRequest): Promise<BatchJobResponse> => {
    const authHeaders = getAuthHeaders();
    if (!authHeaders.Authorization) {
      throw new Error('Oturum geçersiz. Lütfen tekrar giriş yapın.');
    }

    const formatToUse = request.format === 'mp4'
      ? (isSafari() ? 'mp4' : 'mp4')
      : 'mp3';

    const res = await fetch(`${API_BASE_URL}/v1/batches`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
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

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      const code = error?.error?.code || '';
      const message = error?.error?.message || 'Failed to create batch job';
      throw new Error(code ? `${code}: ${message}` : message);
    }

    const data = await res.json();
    return { jobId: data.id };
  },

  /**
   * Get batch job status
   */
  getStatus: async (jobId: string): Promise<BatchJobStatus> => {
    const authHeaders = getAuthHeaders();
    if (!authHeaders.Authorization) {
      throw new Error('Oturum geçersiz. Lütfen tekrar giriş yapın.');
    }

    const [batchRes, itemsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/v1/batches/${jobId}`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        }
      }),
      fetch(`${API_BASE_URL}/v1/batches/${jobId}/items?page=1&limit=200`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        }
      })
    ]);

    if (!batchRes.ok) {
      throw new Error('Failed to get job status');
    }
    if (!itemsRes.ok) {
      throw new Error('Failed to get job items');
    }

    const batch = await batchRes.json();
    const itemsPayload = await itemsRes.json();
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

    const normalizedItems = items.map((item: any, index: number) => {
      const failed = item.status === 'failed' || item.status === 'cancelled';
      return {
        id: index + 1,
        status: failed ? 'failed' : item.status === 'completed' ? 'success' : 'failed',
        provider: item.provider,
        meta: {
          title: item.original_url,
          channel: undefined,
          durationSeconds: undefined,
          thumbnail: undefined
        },
        error: item.error ?? undefined
      };
    });

    const succeeded = normalizedItems.filter((i: any) => i.status === 'success').length;
    const failed = normalizedItems.filter((i: any) => i.status === 'failed').length;

    return {
      state,
      progress: typeof batch.progress === 'number' ? batch.progress : 0,
      result: {
        batchStatus: failed > 0 && succeeded > 0 ? 'completed_with_errors' : 'completed',
        total: normalizedItems.length,
        succeeded,
        failed,
        items: normalizedItems.map((r: any) => ({
          id: r.id,
          title: r.meta?.title || `Item ${r.id}`,
          thumbnail: r.meta?.thumbnail || null,
          provider: r.provider,
          meta: r.meta,
          status: r.status
        })),
        results: normalizedItems
      }
    };
  },

  getDownloadUrl: (jobId: string): string => {
    return `${API_BASE_URL}/v1/batches/${jobId}/zip`;
  },

  getSignedDownloadUrl: async (jobId: string): Promise<string> => {
    const authHeaders = getAuthHeaders();
    if (!authHeaders.Authorization) {
      throw new Error('Oturum geçersiz. Lütfen tekrar giriş yapın.');
    }

    const res = await fetch(`${API_BASE_URL}/v1/batches/${jobId}/zip`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      }
    });

    if (!res.ok) {
      throw new Error('Failed to get download url');
    }
    const data = await res.json();
    return data.url;
  }
};
