
import { useState, useEffect, useRef, useCallback } from 'react';
import { JobProgressResponse, DownloadItem } from '../types';
import { api } from '../services/apiService';

export interface BatchItemStatus {
  videoId: string;
  status: DownloadItem['status'];
  progress: number;
  format: DownloadItem['format'];
  title?: string;
}

export const useBatchProgress = (jobId: string | null) => {
  const [data, setData] = useState<JobProgressResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  }, []);

  useEffect(() => {
    if (!jobId) {
      setData(null);
      return;
    }

    const fetchProgress = async () => {
      try {
        const result = await api.getJobProgress(jobId);
        setData(result);

        if (result.status === 'completed' || result.status === 'failed') {
          stopPolling();
        }
      } catch (err) {
        setError('Failed to fetch progress');
        stopPolling();
      }
    };

    // Initial fetch
    fetchProgress();
    
    // Poll every 1s
    pollInterval.current = setInterval(fetchProgress, 1000);

    return stopPolling;
  }, [jobId, stopPolling]);

  // Expose only per-item status fields (WHITELIST)
  const items: BatchItemStatus[] = data?.items.map(item => ({
    videoId: item.videoId,
    status: item.status,
    progress: item.progress,
    format: item.format,
    title: item.title,
  })) || [];

  return {
    items,
    overallProgress: data?.progress || 0,
    overallStatus: data?.status || 'idle',
    resultReady: data?.resultReady || false,
    downloadUrl: data?.downloadUrl,
    error,
    stopPolling,
  };
};

