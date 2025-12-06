
import { useState, useEffect, useRef, useCallback } from 'react';
import { BatchProgressResponse } from '../types';
import { api } from '../services/apiService';

export const useJobPolling = (jobId: string | null) => {
  const [data, setData] = useState<BatchProgressResponse | null>(null);
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
        const result = await api.getBatchProgress(jobId);
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
    
    // Poll every 1 second
    pollInterval.current = setInterval(fetchProgress, 1000);

    return stopPolling;
  }, [jobId, stopPolling]);

  return { data, error, stopPolling };
};
