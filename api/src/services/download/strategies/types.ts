import type { DownloadContext, DownloadFormat, DownloadQuality, YtDlpCookiesMode } from '../types.js';

export interface FlatDownloadAttempt {
  strategyName: string;
  selector: string;
  hardened: boolean;
  cookiesMode: YtDlpCookiesMode;
  extraHeaders?: Array<{ key: string; value: string }>;
  sleepRequestsSec?: number;
  concurrentFragmentsOverride?: number;
}

export interface FlatDownloadInput {
  url: string;
  format: DownloadFormat;
  quality: DownloadQuality;
  outputFileName: string;
  provider: string;
  context?: DownloadContext;
}
