/**
 * Provider Engine — shared contracts for Input Normalization, Resolver, Preview, and Download layers.
 * Kept stable for web app, API, future CLI, and desktop app.
 */

/** Source type from resolver (backend). */
export type ProviderSourceType = 'video' | 'playlist' | 'channel' | 'profile' | 'direct_media' | 'unknown';

/** Global error codes (preview + download). Preview must not use download-specific codes. */
export type GlobalErrorCode =
  | 'unsupported_source'
  | 'invalid_url'
  | 'preview_unavailable'
  | 'download_failed'
  | 'temporary_provider_error';

/** YouTube-specific (download engine only). */
export type YoutubeErrorCode =
  | 'youtube_login_required'
  | 'youtube_unavailable'
  | 'youtube_region_restricted'
  | 'youtube_bot_check'
  | 'youtube_private_or_removed'
  | 'youtube_client_failed'
  | 'youtube_private_video'
  | 'youtube_age_restricted'
  | 'youtube_extractor_error'
  | 'youtube_format_unavailable'
  | 'youtube_download_error'
  | 'youtube_unknown';

/** Union for any provider error code. */
export type ProviderErrorCode = GlobalErrorCode | YoutubeErrorCode;

// ---------------------------------------------------------------------------
// 1) INPUT NORMALIZATION LAYER
// ---------------------------------------------------------------------------

export interface NormalizedInput {
  /** Valid HTTP(S) URLs, deduplicated, in order of first occurrence. */
  normalizedUrls: string[];
  /** Raw entries that could not be parsed as URLs. */
  invalidEntries: string[];
  /** Number of duplicates removed. */
  duplicatesRemovedCount: number;
}

// ---------------------------------------------------------------------------
// 2) RESOLVER LAYER
// ---------------------------------------------------------------------------

export interface ProviderResolverResult {
  provider: string;
  sourceType: ProviderSourceType;
  normalizedUrl: string;
  supportsPreview: boolean;
  supportsSelection: boolean;
  supportsDownload: boolean;
  allowed: boolean;
  reason?: string;
}

// ---------------------------------------------------------------------------
// 3) PREVIEW LAYER
// ---------------------------------------------------------------------------

export interface ProviderPreviewItem {
  id: string;
  url: string;
  title: string;
  thumbnail?: string | null;
  duration?: string | null;
  publishedAt?: string | null;
}

export interface ProviderPreviewResult {
  provider: string;
  sourceType: ProviderSourceType;
  title?: string | null;
  thumbnail?: string | null;
  duration?: string | null;
  itemCount?: number | null;
  items?: ProviderPreviewItem[];
  warnings?: string[];
  errorCode?: GlobalErrorCode;
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// 4) DOWNLOAD ENGINE LAYER
// ---------------------------------------------------------------------------

export interface ProviderDownloadResult {
  success: boolean;
  filePath?: string;
  mimeType?: string;
  ext?: string;
  sizeBytes?: number;
  errorCode?: ProviderErrorCode;
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// CACHE EXTENSION POINTS
// ---------------------------------------------------------------------------

export interface IPreviewCache {
  get(key: string): Promise<ProviderPreviewResult | null>;
  set(key: string, value: ProviderPreviewResult, ttlSeconds: number): Promise<void>;
}

export interface IDownloadCache {
  get(key: string): Promise<{ filePath: string; mimeType: string; sizeBytes: number } | null>;
  set(key: string, value: { filePath: string; mimeType: string; sizeBytes: number }, ttlSeconds: number): Promise<void>;
}
