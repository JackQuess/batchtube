<<<<<<< HEAD
=======

export type Format = 'mp3' | 'mp4';
export type Quality = 'best' | '4k';
export type JobStatus = 'queued' | 'downloading' | 'processing' | 'completed' | 'failed';

>>>>>>> 69f9136 (Initial commit)
export interface VideoResult {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  channel: string;
<<<<<<< HEAD
  views?: string;
  description?: string;
}

export type JobStatus = 'queued' | 'downloading' | 'processing' | 'completed' | 'failed';
=======
  channelId?: string;
  channelAvatar?: string;
  views?: string;
  description?: string;
  publishedTime?: string;
}

export interface DownloadRequestItem {
  url: string;
  format: Format;
  quality?: Quality;
  title?: string;
}

export interface JobItem {
  id: string; // unique item id
  url: string;
  format: Format;
  quality: Quality;
  status: JobStatus;
  progress: number;
  title?: string;
  filePath?: string;
  error?: string;
}

export interface JobState {
  jobId: string;
  type: 'single' | 'batch';
  status: JobStatus;
  totalItems: number;
  completedItems: number;
  progress: number; // Global progress (0-100)
  items: JobItem[];
  downloadUrl?: string; // Final file or zip URL
  createdAt: number;
  zipName?: string;
}

// Types for downloader service
export interface DownloadItem {
  url: string;
  videoId: string;
  format: Format;
  status: JobStatus;
  progress: number;
  title?: string;
  filePath?: string;
  error?: string;
}
>>>>>>> 69f9136 (Initial commit)

export interface DownloadJob {
  id: string;
  type: 'single' | 'batch';
  status: JobStatus;
<<<<<<< HEAD
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
=======
  progress: number;
  createdAt: number;
  items: DownloadItem[];
  meta: {
    zipName?: string;
  };
  resultUrl?: string;
  error?: string;
}
>>>>>>> 69f9136 (Initial commit)
