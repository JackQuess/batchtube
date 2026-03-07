import { apiClient } from '../lib/apiClient';

export const filesAPI = {
  getDownloadUrl: async (fileId: string): Promise<string> => {
    const data = await apiClient<{ url: string }>(`/v1/files/${fileId}/download`);
    return data.url;
  }
};
