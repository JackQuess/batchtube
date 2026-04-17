/**
 * Download engine — shared types (yt-dlp layer).
 */

export class YtDlpError extends Error {
  stderr: string;
  exitCode: number;
  constructor(message: string, stderr: string, exitCode: number) {
    super(message);
    this.name = 'YtDlpError';
    this.stderr = stderr;
    this.exitCode = exitCode;
  }
}

export type DownloadFormat = 'mp4' | 'mp3' | 'mkv' | 'jpg';
export type DownloadQuality = 'best' | '4k' | '1080p' | '720p';

export type YtDlpCookiesMode = 'none' | 'file' | 'browser';

export interface DownloadOptions {
  format?: DownloadFormat;
  quality?: DownloadQuality;
}

export interface DownloadContext {
  batchId?: string;
}

/** Optional options for runYtDlp (YouTube: extractor args + diagnostics). */
export interface RunYtDlpOptions {
  extractorArgs?: string;
  extraHeaders?: Array<{ key: string; value: string }>;
  strategyName?: string;
  strategyIndex?: number;
  attempt?: number;
  itemId?: string;
  batchId?: string;
  provider?: string;
  cookiesMode?: YtDlpCookiesMode;
  hardened?: boolean;
  timeoutMs?: number;
  /** Optional seconds between HTTP requests (yt-dlp --sleep-requests); helps aggressive providers like Instagram. */
  sleepRequestsSec?: number;
  /** Override -N concurrent fragments (default from config by hardened mode). */
  concurrentFragmentsOverride?: number;
}

export type YoutubeErrorCode =
  | 'youtube_transient'
  | 'youtube_antibot'
  | 'youtube_login_required'
  | 'youtube_private'
  | 'youtube_geo_restricted'
  | 'youtube_cookies_required'
  | 'youtube_rate_limited'
  | 'youtube_extractor_failure'
  | 'youtube_unknown';

export interface YoutubeErrorClassification {
  code: YoutubeErrorCode;
  retriable: boolean;
  authError: boolean;
  clientRetriable: boolean;
}

export interface YoutubeAttempt {
  selector: string;
  selectorIndex: number;
  cookiesMode: YtDlpCookiesMode;
  hardened: boolean;
  clientStrategyIndex: number;
  strategyName: string;
}

export type GenericProviderErrorCode =
  | 'provider_rate_limited'
  | 'provider_access_denied'
  | 'provider_auth_required'
  | 'provider_geo_restricted'
  | 'provider_source_unavailable'
  | 'provider_unsupported'
  | 'provider_transient'
  | 'provider_extractor_failure'
  | 'provider_unknown_failure';

export interface YtDlpProbeFormat {
  format_id?: string;
  ext?: string;
  acodec?: string;
  vcodec?: string;
  height?: number | null;
  protocol?: string;
  filesize?: number | null;
  tbr?: number | null;
}

export interface YtDlpProbePayload {
  formats?: YtDlpProbeFormat[];
}

export interface BuildYtDlpArgsInput {
  url: string;
  format: DownloadFormat;
  qualityOrSelector: string;
  outputTemplate: string;
  cookiesMode: YtDlpCookiesMode;
  options?: RunYtDlpOptions;
}
