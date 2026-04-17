import { runYoutubeDownloadWithFallbacks } from '../youtubePipeline.js';
import type { DownloadContext, DownloadFormat, DownloadQuality } from '../types.js';

export async function downloadYoutubeStrategy(
  url: string,
  format: DownloadFormat,
  quality: DownloadQuality,
  outputFileName: string,
  context?: DownloadContext
): Promise<{ filePath: string; mimeType: string; ext: string }> {
  return runYoutubeDownloadWithFallbacks(url, format, quality, outputFileName, context);
}
