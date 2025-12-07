/**
 * BatchTube 2.0 - Batch API Service
 * Clean API client for queue-based batch downloads
 */
import { API_BASE_URL } from '../config/api';

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
    total: number;
    succeeded: number;
    failed: number;
    items?: Array<{
      id: number;
      title: string;
      thumbnail: string | null;
      status: 'success' | 'failed';
    }>;
    results: Array<{
      id: number;
      status: 'success' | 'failed';
      fileName?: string | null;
      error?: string;
    }>;
  };
  error?: string;
}

export const batchAPI = {
  /**
   * Create a new batch download job
   */
  createJob: async (request: BatchJobRequest): Promise<BatchJobResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/batch`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Failed to create batch job' }));
      throw new Error(error.error || 'Failed to create batch job');
    }

    return res.json();
  },

  /**
   * Get batch job status
   */
  getStatus: async (jobId: string): Promise<BatchJobStatus> => {
    const res = await fetch(`${API_BASE_URL}/api/batch/${jobId}/status`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
      throw new Error('Failed to get job status');
    }

    return res.json();
  },

  /**
   * Get download URL for completed job
   * Returns direct API endpoint (no async needed)
   */
  getDownloadUrl: (jobId: string): string => {
    return `${API_BASE_URL}/api/batch/${jobId}/download`;
  }
};

