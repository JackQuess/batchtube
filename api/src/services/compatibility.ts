import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { recordProviderFailure } from './providerHealth.js';

export interface DownloadResult {
  filePath: string;
  mimeType: string;
  ext: string;
}

/**
 * Short-form MP4 compatibility normalization.
 *
 * For providers like Instagram/TikTok we occasionally see MP4s that are
 * technically valid but fail on some players. This helper performs an
 * isolated remux to H.264 + AAC + faststart when needed.
 *
 * - Provider-gated (currently instagram/tiktok only)
 * - Format-gated (ext === 'mp4')
 * - Best-effort: on failure it throws a provider-specific error code
 *   that the caller can classify as instagram_compatibility_failed, etc.
 */
export async function ensureShortFormMp4Compatibility(
  provider: string,
  result: DownloadResult
): Promise<DownloadResult> {
  const ext = result.ext.toLowerCase();
  if (ext !== 'mp4') return result;

  const p = provider.toLowerCase();
  if (p !== 'instagram' && p !== 'tiktok') return result;

  const input = result.filePath;
  const dir = path.dirname(input);
  const normalizedPath = path.join(dir, 'compat-normalized.mp4');

  // If ffmpeg is not available or remux fails, surface a clear provider code.
  const args = [
    '-y',
    '-i',
    input,
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-profile:v',
    'high',
    '-level',
    '4.1',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '160k',
    '-movflags',
    '+faststart',
    normalizedPath
  ];

  return new Promise<DownloadResult>((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    proc.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', (err) => {
      recordProviderFailure(p === 'instagram' ? 'instagram' : 'tiktok', `${p}_compatibility_failed`);
      reject(
        new Error(
          `${p}_compatibility_failed: ffmpeg spawn failed: ${err.message || 'unknown error'}`
        )
      );
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        recordProviderFailure(p === 'instagram' ? 'instagram' : 'tiktok', `${p}_compatibility_failed`);
        const clipped = stderr.length > 500 ? stderr.slice(-500) : stderr;
        reject(
          new Error(
            `${p}_compatibility_failed: ffmpeg exited ${code}. ${clipped || 'no stderr'}`
          )
        );
        return;
      }

      // Replace original path with normalized one; original clean-up is
      // handled by the existing readDownloadAndCleanup pipeline.
      resolve({
        filePath: normalizedPath,
        mimeType: 'video/mp4',
        ext: 'mp4'
      });
    });
  });
}

