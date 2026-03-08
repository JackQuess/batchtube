import { apiClient } from '../lib/apiClient';

export interface BatchListItem {
  id: string;
  name: string | null;
  status: 'created' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' |
    'resolving_channel' | 'discovering_items' | 'queueing_items';
  progress: number;
  item_count: number;
  created_at: string;
}

export interface ListBatchesResponse {
  data: BatchListItem[];
  meta: { page: number; limit: number; total: number };
}

export const batchesAPI = {
  list: async (params?: { page?: number; limit?: number; status?: BatchListItem['status'] }): Promise<ListBatchesResponse> => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const status = params?.status;
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) query.set('status', status);
    return apiClient<ListBatchesResponse>(`/v1/batches?${query.toString()}`);
  }
};
