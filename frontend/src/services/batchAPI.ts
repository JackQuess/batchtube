import { apiClient } from '../lib/apiClient';

export interface BatchJobRequest {
  items: Array<{
    url: string;
    title?: string;
  }>;
  format: 'mp3' | 'mp4' | 'mkv';
  quality?: 'best' | '720p' | '1080p' | '4k';
}

export interface BatchJobResponse {
  jobId: string;
}

export interface BatchJobStatus {
  state: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  /** When batch is in archive flow: resolving_channel | discovering_items | queueing_items */
  stage?: string;
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
      meta?: { title?: string };
      fileName?: string | null;
      bytes?: number;
      error?: string;
      file_id?: string | null;
    }>;
  };
}

interface BatchResponse {
  id: string;
}

interface BatchDetails {
  status: 'created' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' |
    'resolving_channel' | 'discovering_items' | 'queueing_items' | 'partially_completed';
  progress: number;
}

interface BatchItemsResponse {
  data: Array<{
    original_url: string;
    provider: string;
    status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
    error: string | null;
    file_id?: string | null;
  }>;
}

export const batchAPI = {
  createJob: async (request: BatchJobRequest): Promise<BatchJobResponse> => {
    const data = await apiClient<BatchResponse>('/v1/batches', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Batch download',
        urls: request.items.map((item) => item.url),
        auto_start: true,
        options: {
          format: request.format,
          quality: request.quality ?? 'best',
          archive_as_zip: true
        }
      })
    });

    return { jobId: data.id };
  },

  createArchive: async (request: {
    source_url: string;
    mode: 'latest_25' | 'latest_n' | 'all' | 'select';
    latest_n?: number;
    format?: 'mp3' | 'mp4' | 'mkv';
    quality?: 'best' | '720p' | '1080p' | '4k';
  }): Promise<BatchJobResponse & { channel?: { title: string; thumbnail: string | null } }> => {
    const data = await apiClient<BatchResponse & { channel_detected?: boolean; channel?: { title: string; thumbnail: string | null } }>(
      '/v1/archive',
      {
        method: 'POST',
        body: JSON.stringify({
          source_url: request.source_url,
          mode: request.mode,
          latest_n: request.mode === 'latest_n' ? request.latest_n : undefined,
          options: {
            format: request.format ?? 'mp4',
            quality: request.quality ?? 'best',
            archive_as_zip: true
          }
        })
      }
    );
    return { jobId: data.id, channel: data.channel };
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
      resolving_channel: 'active',
      discovering_items: 'active',
      queueing_items: 'active',
      processing: 'active',
      completed: 'completed',
      partially_completed: 'completed',
      failed: 'failed',
      cancelled: 'failed'
    };
    const state = stateMap[batch.status] || 'waiting';

    const stageLabels: Record<string, string> = {
      resolving_channel: 'Resolving channel...',
      discovering_items: 'Discovering items...',
      queueing_items: 'Queueing items...'
    };
    const stage = stageLabels[batch.status];

    const normalizedItems = items.map((item, index) => {
      const failed = item.status === 'failed' || item.status === 'cancelled';
      return {
        id: index + 1,
        status: failed ? 'failed' : item.status === 'completed' ? 'success' : 'failed',
        provider: item.provider,
        meta: {
          title: item.original_url
        },
        error: item.error || undefined,
        file_id: item.file_id ?? undefined
      };
    });

    const succeeded = normalizedItems.filter((i) => i.status === 'success').length;
    const failed = normalizedItems.filter((i) => i.status === 'failed').length;

    return {
      state,
      progress: typeof batch.progress === 'number' ? batch.progress : 0,
      ...(stage && { stage }),
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
  },

  cancel: async (jobId: string): Promise<void> => {
    await apiClient(`/v1/batches/${jobId}/cancel`, { method: 'POST' });
  }
};
