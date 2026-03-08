/**
 * Minimal preview cache: in-memory, TTL. Key = provider + normalizedUrl.
 * Extension point for Redis or other store later.
 */

import type { IPreviewCache, ProviderPreviewResult } from '../types/providerEngine.js';

const store = new Map<string, { value: ProviderPreviewResult; expiresAt: number }>();

const DEFAULT_TTL_SECONDS = 300; // 5 min

export const previewCache: IPreviewCache = {
  async get(key: string): Promise<ProviderPreviewResult | null> {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.value;
  },

  async set(key: string, value: ProviderPreviewResult, ttlSeconds: number = DEFAULT_TTL_SECONDS): Promise<void> {
    store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }
};

export function buildPreviewCacheKey(provider: string, normalizedUrl: string): string {
  return `${provider}:${normalizedUrl}`;
}
