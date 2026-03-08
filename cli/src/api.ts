/**
 * API client for BatchTube. All requests use Bearer token (API key).
 * Base URL must include /v1 (e.g. https://api.batchtube.net/v1) or paths are relative to base.
 */

export interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    request_id?: string;
    details?: Record<string, unknown>;
  };
}

export class BatchTubeApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'BatchTubeApiError';
  }
}

export interface CreateBatchBody {
  urls: string[];
  name?: string;
  options?: {
    format?: 'mp4' | 'mp3' | 'mkv';
    quality?: 'best' | '4k' | '1080p' | '720p';
    archive_as_zip?: boolean;
  };
  auto_start?: boolean;
  callback_url?: string;
}

export interface BatchResponse {
  id: string;
  name: string | null;
  status: string;
  progress: number;
  item_count: number;
  created_at: string;
}

export interface AccountUsageResponse {
  plan: string;
  cycle_reset: string;
  credits?: { used: number; limit: number; available: number };
  limits?: Record<string, number>;
  used?: Record<string, number>;
}

export interface FileDownloadResponse {
  url: string;
  expires_at: string;
}

export interface BatchZipResponse {
  url: string;
  expires_at: string;
}

export interface FileListItem {
  id: string;
  name?: string;
  filename?: string;
  size: number;
  expires?: string;
  expires_at?: string;
}

export async function apiRequest<T>(
  baseUrl: string,
  apiKey: string,
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const url = path.startsWith('http') ? path : `${baseUrl.replace(/\/+$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data: T | ApiErrorBody = null as T;
  try {
    data = text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    if (!res.ok) throw new BatchTubeApiError(text || res.statusText, res.status);
  }
  if (!res.ok) {
    const err = data as ApiErrorBody;
    const msg = err?.error?.message || res.statusText || `HTTP ${res.status}`;
    const code = err?.error?.code;
    const details = err?.error?.details;
    throw new BatchTubeApiError(msg, res.status, code, details);
  }
  return data as T;
}

export async function createBatch(
  baseUrl: string,
  apiKey: string,
  body: CreateBatchBody
): Promise<BatchResponse> {
  return apiRequest<BatchResponse>(baseUrl, apiKey, 'POST', '/v1/batches', body);
}

export async function getBatch(
  baseUrl: string,
  apiKey: string,
  batchId: string
): Promise<BatchResponse> {
  return apiRequest<BatchResponse>(baseUrl, apiKey, 'GET', `/v1/batches/${batchId}`);
}

export async function getAccountUsage(
  baseUrl: string,
  apiKey: string
): Promise<AccountUsageResponse> {
  return apiRequest<AccountUsageResponse>(baseUrl, apiKey, 'GET', '/v1/account/usage');
}

export async function getFileDownload(
  baseUrl: string,
  apiKey: string,
  fileId: string
): Promise<FileDownloadResponse> {
  return apiRequest<FileDownloadResponse>(baseUrl, apiKey, 'GET', `/v1/files/${fileId}/download`);
}

export async function getBatchZip(
  baseUrl: string,
  apiKey: string,
  batchId: string
): Promise<BatchZipResponse> {
  return apiRequest<BatchZipResponse>(baseUrl, apiKey, 'GET', `/v1/batches/${batchId}/zip`);
}

/** List files - backend may not implement GET /v1/files; 404 returns empty list with message. */
export interface ListFilesResponse {
  data?: FileListItem[];
  meta?: { page: number; total: number };
}

export async function listFiles(
  baseUrl: string,
  apiKey: string,
  page = 1,
  limit = 50
): Promise<ListFilesResponse> {
  return apiRequest<ListFilesResponse>(
    baseUrl,
    apiKey,
    'GET',
    `/v1/files?page=${page}&limit=${limit}`
  );
}
