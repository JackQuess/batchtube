export type ProviderId =
  | 'youtube'
  | 'tiktok'
  | 'instagram'
  | 'twitter'
  | 'facebook'
  | 'vimeo'
  | 'dailymotion'
  | 'twitch'
  | 'reddit'
  | 'soundcloud'
  | 'mixcloud'
  | 'streamable'
  | 'bilibili'
  | 'vk'
  | 'bandcamp'
  | 'okru'
  | 'rutube'
  | 'coub'
  | 'archive'
  | '9gag'
  | 'loom'
  | 'linkedin'
  | 'pinterest'
  | 'tumblr'
  | 'generic';

export type ProviderErrorCode =
  | 'UNSUPPORTED_URL'
  | 'METADATA_FAILED'
  | 'DOWNLOAD_FAILED'
  | 'RESTRICTED'
  | 'NEEDS_VERIFICATION'
  | 'FORBIDDEN'
  | 'UNKNOWN';

export interface VideoInfo {
  platform: ProviderId;
  url: string;
  id?: string;
  title?: string;
  channel?: string;
  durationSeconds?: number;
  thumbnail?: string;
}

export interface DownloadOptions {
  outDir: string;
  format?: 'video' | 'audio';
  quality?: 'best' | '1080p' | '720p' | '480p';
}

export interface DownloadResult {
  filePath: string;
  fileName: string;
  bytes?: number;
}

export class ProviderError extends Error {
  code: ProviderErrorCode;
  hint?: string;

  constructor(code: ProviderErrorCode, message: string, hint?: string) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.hint = hint;
  }
}

export interface Provider {
  id: ProviderId;
  match: (url: string) => boolean;
  getMetadata: (url: string) => Promise<VideoInfo>;
  download: (url: string, opts: DownloadOptions) => Promise<DownloadResult>;
}
