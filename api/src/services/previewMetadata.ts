/**
 * PREVIEW LAYER — lightweight metadata for single video/source.
 * Uses yt-dlp --dump-single-json (no download). Errors are preview_unavailable only.
 */

import { spawn } from 'node:child_process';
import type { ProviderPreviewResult } from '../types/providerEngine.js';
import { isMediaUrlAllowed } from './providers.js';
import { resolveToProviderResult } from './sourceResolver.js';
import { previewCache, buildPreviewCacheKey } from './previewCache.js';

const YT_DLP = 'yt-dlp';
const PREVIEW_TIMEOUT_MS = 12_000;

export async function getPreviewMetadata(url: string): Promise<ProviderPreviewResult> {
  const validation = isMediaUrlAllowed(url);
  if (!validation.ok) {
    return {
      provider: 'generic',
      sourceType: 'unknown',
      errorCode: 'invalid_url',
      errorMessage: validation.reason ?? 'URL not allowed'
    };
  }

  const resolved = resolveToProviderResult(url);
  if (!resolved) {
    return {
      provider: 'generic',
      sourceType: 'unknown',
      errorCode: 'invalid_url',
      errorMessage: 'Could not resolve URL'
    };
  }

  const cacheKey = buildPreviewCacheKey(resolved.provider, resolved.normalizedUrl);
  const cached = await previewCache.get(cacheKey);
  if (cached) return cached;

  const result = await fetchSingleJson(url, resolved.provider);
  if (result) await previewCache.set(cacheKey, result, 300);
  return result;
}

function fetchSingleJson(url: string, provider: string): Promise<ProviderPreviewResult> {
  return new Promise((resolve) => {
    const args = [
      '--dump-single-json',
      '--no-download',
      '--no-warnings',
      '--no-check-certificate',
      '--skip-download',
      url
    ];
    const proc = spawn(YT_DLP, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    proc.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });

    const timeout = setTimeout(() => {
      proc.kill('SIGTERM');
      resolve({
        provider,
        sourceType: 'video',
        errorCode: 'preview_unavailable',
        errorMessage: 'Preview timed out'
      });
    }, PREVIEW_TIMEOUT_MS);

    proc.on('error', () => {
      clearTimeout(timeout);
      resolve({
        provider,
        sourceType: 'video',
        errorCode: 'temporary_provider_error',
        errorMessage: 'Preview failed'
      });
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        resolve({
          provider,
          sourceType: 'video',
          errorCode: 'preview_unavailable',
          errorMessage: 'Preview unavailable for this source'
        });
        return;
      }
      try {
        const obj = JSON.parse(stdout) as Record<string, unknown>;
        const title = (obj.title ?? '') as string;
        const thumb = (obj.thumbnail ?? (obj.thumbnails as Array<{ url?: string }>)?.[0]?.url) as string | undefined;
        const duration = (obj.duration ?? obj.duration_string) as number | string | undefined;
        let durationStr: string | null = null;
        if (typeof duration === 'number') {
          const m = Math.floor(duration / 60);
          const s = Math.floor(duration % 60);
          durationStr = `${m}:${s.toString().padStart(2, '0')}`;
        } else if (typeof duration === 'string') durationStr = duration;

        resolve({
          provider,
          sourceType: 'video',
          title: title || null,
          thumbnail: thumb ?? null,
          duration: durationStr ?? null
        });
      } catch {
        resolve({
          provider,
          sourceType: 'video',
          errorCode: 'preview_unavailable',
          errorMessage: 'Could not parse preview'
        });
      }
    });
  });
}
