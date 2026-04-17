import { ensureShortFormMp4Compatibility } from '../compatibility.js';
import { downloadDefaultStrategy } from './strategies/defaultStrategy.js';
import { downloadInstagramStrategy } from './strategies/instagramStrategy.js';
import { downloadTiktokStrategy } from './strategies/tiktokStrategy.js';
import { downloadYoutubeStrategy } from './strategies/youtubeStrategy.js';
import type { DownloadContext, DownloadOptions } from './types.js';

/**
 * Routes URL download to the correct provider strategy (cookie order, headers, backoff).
 */
export class ProviderDownloadOrchestrator {
  async downloadWithYtDlp(
    url: string,
    options: DownloadOptions,
    outputFileName: string,
    provider?: string,
    context?: DownloadContext
  ): Promise<{ filePath: string; mimeType: string; ext: string }> {
    const format = options.format ?? 'mp4';
    const quality = options.quality ?? 'best';
    const p = (provider ?? '').toLowerCase();

    if (p === 'youtube') {
      return downloadYoutubeStrategy(url, format, quality, outputFileName, context);
    }

    const flatInput = { url, format, quality, outputFileName, provider: provider ?? 'generic', context };

    if (p === 'instagram') {
      return this.withMp4Compatibility('instagram', () => downloadInstagramStrategy(flatInput));
    }

    if (p === 'tiktok') {
      return this.withMp4Compatibility('tiktok', () => downloadTiktokStrategy(flatInput));
    }

    if (format === 'mp3') {
      console.log(
        JSON.stringify({
          msg: 'mp3_branch_used',
          provider: provider ?? 'generic',
          quality
        })
      );
    }

    return this.withMp4Compatibility(provider ?? 'generic', () => downloadDefaultStrategy(flatInput));
  }

  private async withMp4Compatibility(
    provider: string,
    download: () => Promise<{ filePath: string; mimeType: string; ext: string }>
  ): Promise<{ filePath: string; mimeType: string; ext: string }> {
    const baseResult = await download();

    try {
      const compat = await ensureShortFormMp4Compatibility(provider, baseResult);
      if (compat !== baseResult) {
        console.log(
          JSON.stringify({
            msg: 'compatibility_transcode_succeeded',
            provider,
            originalExt: baseResult.ext,
            normalizedExt: compat.ext
          })
        );
      }
      return compat;
    } catch (compatErr) {
      const err = compatErr instanceof Error ? compatErr : new Error(String(compatErr));
      console.error(
        JSON.stringify({
          msg: 'compatibility_transcode_failed',
          provider,
          error: err.message
        })
      );
      throw err;
    }
  }
}

const orchestratorSingleton = new ProviderDownloadOrchestrator();

export function downloadWithYtDlp(
  url: string,
  options: DownloadOptions,
  outputFileName: string,
  provider?: string,
  context?: DownloadContext
): Promise<{ filePath: string; mimeType: string; ext: string }> {
  return orchestratorSingleton.downloadWithYtDlp(url, options, outputFileName, provider, context);
}
