import { apiClient } from '../lib/apiClient';

export type ProcessingMode = 'none' | 'upscale_4k' | 'resolution_convert' | 'format_convert';

export type TargetResolution = '720p' | '1080p' | '1440p' | '4k';

export type TargetFormat = 'mp4' | 'mkv' | 'mov' | 'webm';

export interface CreateUpScaleJobRequest {
  name?: string;
  options: {
    processing_mode?: ProcessingMode;
    target_resolution?: TargetResolution;
    target_format?: TargetFormat;
    archive_as_zip?: boolean;
    callback_url?: string;
  };
  files: {
    filename: string;
    content_type?: string;
    size_bytes?: number;
  }[];
}

export interface CreateUpScaleJobResponseFile {
  item_id: string;
  filename: string;
  upload_url: string;
  headers: Record<string, string>;
}

export interface CreateUpScaleJobResponse {
  id: string;
  name: string;
  status: string;
  item_count: number;
  created_at: string;
  options: {
    processing_mode: ProcessingMode;
    target_resolution: TargetResolution;
    target_format: TargetFormat;
    archive_as_zip: boolean;
  };
  files: CreateUpScaleJobResponseFile[];
}

export interface StartUpScaleJobResponse {
  id: string;
  status: string;
  item_count: number;
}

export interface GetUpScaleJobItem {
  id: string;
  original_name: string;
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
  progress: number | null;
  has_output: boolean;
  file_id: string | null;
}

export interface GetUpScaleJobResponse {
  id: string;
  name: string;
  status: string;
  progress: number;
  item_count: number;
  created_at: string;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  options: {
    processing_mode: ProcessingMode;
    target_resolution: TargetResolution;
    target_format: TargetFormat;
    archive_as_zip: boolean;
  };
  items: GetUpScaleJobItem[];
  zip_ready: boolean;
}

export const upscaleAPI = {
  createJob: async (body: CreateUpScaleJobRequest): Promise<CreateUpScaleJobResponse> => {
    return apiClient<CreateUpScaleJobResponse>('/v1/upscale/jobs', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  startJob: async (id: string): Promise<StartUpScaleJobResponse> => {
    return apiClient<StartUpScaleJobResponse>(`/v1/upscale/jobs/${id}/start`, {
      method: 'POST'
    });
  },

  getJob: async (id: string): Promise<GetUpScaleJobResponse> => {
    return apiClient<GetUpScaleJobResponse>(`/v1/upscale/jobs/${id}`);
  }
};

