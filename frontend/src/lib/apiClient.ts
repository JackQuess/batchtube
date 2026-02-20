import { API_BASE_URL } from '../config/api';
import { getAuthHeaders } from './auth';

export interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    request_id?: string;
    details?: Record<string, unknown>;
  };
}

export class ApiError extends Error {
  code: string;
  status: number;
  details: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const normalizePath = (path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE_URL.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
};

const parseResponse = async <T>(res: Response): Promise<T> => {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json() as Promise<T>;
  }
  return {} as T;
};

export async function apiClient<T>(path: string, init: RequestInit = {}, requireAuth = true): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (requireAuth) {
    const auth = getAuthHeaders();
    if (!auth.Authorization) {
      throw new ApiError(401, 'unauthorized', 'Oturum bulunamadı. Lütfen tekrar giriş yapın.');
    }
    headers.set('Authorization', auth.Authorization);
  }

  const res = await fetch(normalizePath(path), {
    ...init,
    mode: 'cors',
    credentials: 'omit',
    headers
  });

  if (!res.ok) {
    const payload = await parseResponse<ApiErrorPayload>(res).catch(() => ({}));
    const code = payload?.error?.code || 'request_failed';
    const message = payload?.error?.message || 'İstek başarısız.';
    const details = payload?.error?.details || {};
    throw new ApiError(res.status, code, message, details);
  }

  return parseResponse<T>(res);
}
