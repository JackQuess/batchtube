import type { DownloadFormat, DownloadQuality } from './types.js';

export const YT_DLP = 'yt-dlp';
export const MAX_STDERR_LOG = 2000;
export const YTDLP_VERSION_TIMEOUT_MS = 5000;

export const QUALITY_SELECTORS: Record<DownloadQuality, string> = {
  best: 'bv*+ba/b',
  '4k': 'bestvideo[height<=2160]+bestaudio/best',
  '1080p': 'bestvideo[height<=1080]+bestaudio/best',
  '720p': 'bestvideo[height<=720]+bestaudio/best'
};

/** When format is MP4, prefer H.264 (avc1) so the file plays in QuickTime Player / default macOS players. */
export const QUALITY_SELECTORS_MP4_QUICKTIME: Record<DownloadQuality, string> = {
  best: 'bv*[vcodec^=avc1][ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv*[vcodec^=avc1]+ba/b',
  '4k': 'bv*[vcodec^=avc1][height<=2160][ext=mp4]+ba[ext=m4a]/b[height<=2160][ext=mp4]/bv*[height<=2160]+ba/b[height<=2160]',
  '1080p': 'bv*[vcodec^=avc1][height<=1080][ext=mp4]+ba[ext=m4a]/b[height<=1080][ext=mp4]/bv*[height<=1080]+ba/b[height<=1080]',
  '720p': 'bv*[vcodec^=avc1][height<=720][ext=mp4]+ba[ext=m4a]/b[height<=720][ext=mp4]/bv*[height<=720]+ba/b[height<=720]'
};

export const YOUTUBE_CLIENT_STRATEGIES: readonly string[] = [
  'youtube:player_client=web',
  'youtube:player_client=web_safari',
  'youtube:player_client=android,tv_embedded,web'
];

export const YOUTUBE_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

export const YOUTUBE_VIDEO_FORMAT_FALLBACK = ['bestvideo+bestaudio/best', 'best', 'bestaudio'];
export const YOUTUBE_VIDEO_FORMAT_FALLBACK_MP4 = [
  'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]',
  'bestvideo[vcodec^=avc1]+bestaudio/best',
  'bestvideo+bestaudio/best',
  'best'
];

export function getYoutubeFormatSelectors(format: DownloadFormat, quality: DownloadQuality): string[] {
  if (format === 'mp3') return [''];
  const primary = format === 'mp4' ? QUALITY_SELECTORS_MP4_QUICKTIME[quality] : QUALITY_SELECTORS[quality];
  const fallback = format === 'mp4' ? YOUTUBE_VIDEO_FORMAT_FALLBACK_MP4 : YOUTUBE_VIDEO_FORMAT_FALLBACK;
  return [...new Set([primary, ...fallback])];
}
