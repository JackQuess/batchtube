export interface VideoResult {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  channel: string;
  views?: string;
  description?: string;
}

export type JobStatus = 'queued' | 'downloading' | 'processing' | 'completed' | 'failed';

export interface DownloadJob {
  id: string;
  type: 'single' | 'batch';
  status: JobStatus;
  progress: number; // 0-100
  resultUrl?: string; // Path to download file
  error?: string;
  createdAt: number;
  items: DownloadItem[];
  meta: {
    title?: string; // For single files
    zipName?: string; // For batches
  };
}

export interface DownloadItem {
  url: string;
  videoId: string;
  format: 'mp3' | 'mp4';
  status: JobStatus;
  progress: number;
  filePath?: string;
  title?: string;
}