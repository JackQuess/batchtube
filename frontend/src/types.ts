
export type VideoFormat = 'mp4' | 'mp3';

export type MP4Quality = '4K' | '1440p' | '1080p' | '720p' | '480p';
export type MP3Quality = '320k' | '128k';
export type VideoQuality = MP4Quality | MP3Quality;

export type JobStatus = 'queued' | 'downloading' | 'processing' | 'completed' | 'failed';

export interface VideoResult {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  channel: string;
  views?: string;
  description?: string;
}

export interface DownloadItem {
  videoId: string;
  format: VideoFormat;
  status: JobStatus;
  progress: number;
  title?: string;
}

export interface DownloadTask {
  id: string;
  video: VideoResult;
  format: VideoFormat;
  status: JobStatus;
  progress: number;
}

export interface JobProgressResponse {
  id: string;
  status: JobStatus;
  progress: number;
  resultReady: boolean;
  items: DownloadItem[];
  error?: string;
}

export interface SelectionItem {
  video: VideoResult;
  format: VideoFormat;
  quality: VideoQuality;
}

export interface BatchItem {
  index: number;
  title: string;
  percent: number;
  status: JobStatus;
  speed: string;
  eta: string;
  fileName: string | null;
  error: string | null;
}

export interface BatchProgressResponse {
  jobId: string;
  status: JobStatus;
  totalItems: number;
  completedItems: number;
  overallPercent: number;
  items: BatchItem[];
  downloadUrl: string | null;
  error: string | null;
}

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'tr' | 'pt' | 'ar';

export type LegalDocType = 'terms' | 'privacy' | 'cookies' | 'legal';

export interface Translations {
  heroTitle: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  searchButton: string;
  pasteLink: string;
  
  // Card
  singleDownload: string;
  addToBatch: string;
  selected: string;
  
  // Batch Bar
  itemsSelected: string;
  clearAll: string;
  downloadZip: string;
  formatLabel: string;
  viewList: string;
  readyToProcess: string;
  
  // Status
  downloading: string;
  processing: string;
  completed: string;
  failed: string;
  saveFile: string;
  preparing: string;
  
  // Legal
  terms: string;
  privacy: string;
  cookies: string;
  legal: string;
  close: string;
  acceptCookies: string;
  cookieMessage: string;
  
  // Cookie Consent
  cookie: {
    message: string;
    accept: string;
    reject: string;
    essential: string;
    reset: string;
  };
}