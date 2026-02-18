import type { ApiError } from './types';

export class RequestError extends Error {
  code: string;
  details: Record<string, unknown>;

  constructor(payload: ApiError['error']) {
    super(payload.message);
    this.code = payload.code;
    this.details = payload.details;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {})
    }
  });

  if (!res.ok) {
    const payload = (await res.json()) as ApiError;
    throw new RequestError(payload.error);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
