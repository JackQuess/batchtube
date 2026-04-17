/**
 * DOWNLOAD ENGINE LAYER
 * Actual file download only (after user confirms). Uses yt-dlp, retries, format/cookie fallback, ffmpeg, then storage.
 * Success: returns { filePath, mimeType, ext }. Failure: throws with message that may start with ProviderErrorCode.
 * See types/providerEngine.ts ProviderDownloadResult for the standard contract.
 *
 * Implementation lives under `./download/`; this file preserves the public module path `services/download.js`.
 */

export { YtDlpError } from './download/types.js';
export type {
  BuildYtDlpArgsInput,
  DownloadContext,
  DownloadFormat,
  DownloadOptions,
  DownloadQuality,
  GenericProviderErrorCode,
  RunYtDlpOptions,
  YtDlpCookiesMode,
  YtDlpProbeFormat,
  YtDlpProbePayload,
  YoutubeAttempt,
  YoutubeErrorClassification,
  YoutubeErrorCode
} from './download/types.js';

export { classifyGenericProviderError, classifyYoutubeError } from './download/errorClassifier.js';
export { buildYtDlpArgs } from './download/buildYtDlpArgs.js';
export {
  getYoutubeFormatSelectors,
  planYoutubeNextAttempts,
  selectYoutubeFormatSelectorFromFormats
} from './download/youtubeFormatPlan.js';
export { ProviderDownloadOrchestrator, downloadWithYtDlp } from './download/orchestrator.js';
export { readDownloadAndCleanup } from './download/readDownload.js';
