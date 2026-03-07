import { apiClient } from '../lib/apiClient';

export interface ApiKeyRow {
  id: string;
  key_prefix: string;
  name: string | null;
  created_at: string;
  last_used_at: string | null;
}

export interface CreateApiKeyResponse {
  id: string;
  key: string;
  created_at: string;
}

export interface ListApiKeysResponse {
  data: ApiKeyRow[];
}

export const apiKeysAPI = {
  create: async (name?: string): Promise<CreateApiKeyResponse> => {
    return apiClient<CreateApiKeyResponse>('/v1/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name: name ?? 'API Key' })
    });
  },

  list: async (): Promise<ApiKeyRow[]> => {
    const res = await apiClient<ListApiKeysResponse>('/v1/api-keys');
    return res.data;
  },

  revoke: async (id: string): Promise<void> => {
    await apiClient(`/v1/api-keys/${id}`, { method: 'DELETE' });
  }
};
