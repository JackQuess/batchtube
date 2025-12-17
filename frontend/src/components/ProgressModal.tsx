/**
 * BatchTube 2.0 - Progress Modal
 * Premium UI for batch download progress tracking
 */
import React, { useEffect, useState } from 'react';
import { batchAPI, BatchJobStatus } from '../services/batchAPI';
import { API_BASE_URL } from '../config/api';
import { CheckCircle, AlertCircle, Loader2, DownloadCloud, X } from 'lucide-react';

interface ProgressModalProps {
  jobId: string;
  onClose: () => void;
  totalItems: number;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({ 
  jobId, 
  onClose, 
  totalItems 
}) => {
  type ItemProgress = { percent: number; title: string; thumbnail: string | null };
  const [status, setStatus] = useState<BatchJobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [itemProgress, setItemProgress] = useState<Record<number, ItemProgress>>({});

  // Subscribe to SSE stream for live progress
  useEffect(() => {
    let eventSource: EventSource | null = null;

    import('../config/api').then(({ API_BASE_URL }) => {
      eventSource = new EventSource(`${API_BASE_URL}/api/batch/${jobId}/events`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.items) {
            // Update per-item progress with full item data
            const progressMap: Record<number, { percent: number; title: string; thumbnail: string | null }> = {};
            data.items.forEach((item: { index: number; percent: number; title?: string; thumbnail?: string | null }) => {
              progressMap[item.index] = {
                percent: item.percent,
                title: item.title || `Item ${item.index + 1}`,
                thumbnail: item.thumbnail || null
              };
            });
            setItemProgress(prev => ({ ...prev, ...progressMap }));
          }
        } catch (err) {
          console.error('[ProgressModal] SSE parse error:', err);
        }
      };

      eventSource.addEventListener('progress', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.items) {
            // Update per-item progress with full item data
            const progressMap: Record<number, { percent: number; title: string; thumbnail: string | null }> = {};
            data.items.forEach((item: { index: number; percent: number; title?: string; thumbnail?: string | null }) => {
              progressMap[item.index] = {
                percent: item.percent,
                title: item.title || `Item ${item.index + 1}`,
                thumbnail: item.thumbnail || null
              };
            });
            setItemProgress(prev => ({ ...prev, ...progressMap }));
          }
        } catch (err) {
          console.error('[ProgressModal] SSE progress error:', err);
        }
      });

      eventSource.addEventListener('completed', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          setIsPolling(false);
          // Fetch final status
          batchAPI.getStatus(jobId).then(setStatus);
        } catch (err) {
          console.error('[ProgressModal] SSE completed error:', err);
        }
      });

      eventSource.addEventListener('failed', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          setIsPolling(false);
          setError(data.error || 'Job failed');
        } catch (err) {
          console.error('[ProgressModal] SSE failed error:', err);
        }
      });

      eventSource.addEventListener('error', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          setError(data.error || 'Connection error');
          setIsPolling(false);
        } catch (err) {
          console.error('[ProgressModal] SSE error event:', err);
        }
      });

      eventSource.onerror = () => {
        console.error('[ProgressModal] SSE connection error');
        if (eventSource) {
          eventSource.close();
        }
        // Fallback to polling
        setIsPolling(true);
      };
    });

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [jobId]);

  // Fallback polling for status updates
  useEffect(() => {
    if (!isPolling) return;

    const pollInterval = setInterval(async () => {
      try {
        const jobStatus = await batchAPI.getStatus(jobId);
        setStatus(jobStatus);

        // Stop polling if job is completed or failed
        if (jobStatus.state === 'completed' || jobStatus.state === 'failed') {
          setIsPolling(false);
        }
      } catch (err) {
        console.error('[ProgressModal] Polling error:', err);
        // Don't set error on polling failure, SSE might still work
      }
    }, 3000); // Poll every 3 seconds as fallback

    // Initial fetch
    batchAPI.getStatus(jobId)
      .then(setStatus)
      .catch(err => {
        console.error('[ProgressModal] Initial status error:', err);
      });

    return () => clearInterval(pollInterval);
  }, [jobId, isPolling]);

  const handleDownload = () => {
    // Direct download from API endpoint (combined ZIP)
    const downloadUrl = batchAPI.getDownloadUrl(jobId);
    window.location.href = downloadUrl;
  };

  if (error && !status) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <div className="w-full max-w-md bg-[#111118] border border-white/5 rounded-2xl shadow-xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <h2 className="text-lg sm:text-xl font-bold text-white">Error</h2>
          </div>
          <p className="text-sm text-gray-400 mb-6">{error}</p>
          <button
            onClick={onClose}
            className="w-full py-2.5 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = status?.state === 'completed';
  const isFailed = status?.state === 'failed';
  const isActive = status?.state === 'active';
  const isWaiting = status?.state === 'waiting';

  const result = status?.result;

  // Calculate overall progress from itemProgress or fallback to status.progress
  const itemProgressValues = Object.values(itemProgress) as ItemProgress[];
  const overallProgress = itemProgressValues.length > 0
    ? Math.round(itemProgressValues.reduce((sum, item) => sum + item.percent, 0) / (result?.items?.length || totalItems || 1))
    : (typeof status?.progress === 'object' && status.progress?.overall 
        ? status.progress.overall 
        : (typeof status?.progress === 'number' ? status.progress : 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 animate-fadeIn">
      <div className="w-full max-w-xl md:max-w-2xl bg-[#111118] border border-white/5 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/5 bg-[#0e0e11]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2 min-w-0">
              {isCompleted ? <CheckCircle className="text-green-500 flex-shrink-0" size={20} /> : 
               isFailed ? <AlertCircle className="text-red-500 flex-shrink-0" size={20} /> : 
               <Loader2 className="animate-spin text-[#d94662] flex-shrink-0" size={20} />}
              
              <span className="truncate">
                {isCompleted ? 'Batch Completed' : 
                 isFailed ? 'Batch Failed' : 
                 isActive ? 'Downloading...' : 
                 'Preparing...'}
              </span>
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-white transition-colors flex-shrink-0"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-400 truncate pr-2">
                {result ? `${result.succeeded} / ${result.total} succeeded` : 
                 `${totalItems} items`}
              </span>
              <span className="text-gray-400 font-bold flex-shrink-0">
                {overallProgress}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  isCompleted ? 'bg-green-500' : 
                  isFailed ? 'bg-red-500' : 
                  'bg-[#d94662]'
                }`} 
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Results List with Per-Item Progress Bars */}
        <div className="flex-1 overflow-y-auto bg-[#0e0e11] max-h-[60vh] sm:max-h-[70vh]">
          <div className="p-4 space-y-3">
            {/* Show items from itemProgress during download, or from result when completed */}
            {(isActive || isWaiting) && Object.keys(itemProgress).length > 0 ? (
              // Show downloading items with live progress
              Object.entries(itemProgress)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([indexStr, itemData]) => {
                  const index = parseInt(indexStr);
                  const item = itemData as ItemProgress;
                  const isItemDownloading = isActive && item.percent < 100;
                  
                  return (
                    <div 
                      key={index} 
                      className="flex gap-3 items-center w-full p-3 rounded-lg bg-[#141418] border border-white/5"
                    >
                    {/* Thumbnail */}
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden">
                      <img 
                        src={item.thumbnail || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%23111" width="48" height="48"/%3E%3Ctext fill="%23999" font-size="10" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E%3F%3C/text%3E%3C/svg%3E'} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%23111" width="48" height="48"/%3E%3Ctext fill="%23999" font-size="10" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E%3F%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                    
                    {/* Content with Progress Bar */}
                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-shrink-0">
                          {isItemDownloading ? (
                            <Loader2 className="text-[#d94662] animate-spin" size={14} />
                          ) : item.percent >= 100 ? (
                            <CheckCircle className="text-green-500" size={14} />
                          ) : null}
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-gray-200 truncate flex-1 min-w-0">
                          {item.title}
                        </div>
                        {isItemDownloading && (
                          <span className="text-xs text-gray-400 font-mono flex-shrink-0">
                            {item.percent}%
                          </span>
                        )}
                      </div>
                      
                      {/* Progress Bar */}
                      {isItemDownloading && (
                        <div className="w-full mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="bg-[#d94662] h-full transition-all duration-300"
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      {isItemDownloading ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400">
                          Downloading
                        </span>
                      ) : item.percent >= 100 ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                          Success
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400">
                          Waiting
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
          ) : result && result.items && result.items.length > 0 ? (
            // Show completed items with final status
            result.items.map((item) => {
              const resultItem = result.results?.find(r => r.id === item.id);
              const displayName = resultItem?.fileName || item.title;
              const itemStatus = resultItem?.status || item.status;
              const isItemCompleted = itemStatus === 'success';
              const isItemFailed = itemStatus === 'failed';
              
              return (
                <div 
                  key={item.id} 
                  className="flex gap-3 items-center w-full p-3 rounded-lg bg-[#141418] border border-white/5"
                >
                  {/* Thumbnail */}
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden">
                    <img 
                      src={item.thumbnail || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%23111" width="48" height="48"/%3E%3Ctext fill="%23999" font-size="10" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E%3F%3C/text%3E%3C/svg%3E'} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%23111" width="48" height="48"/%3E%3Ctext fill="%23999" font-size="10" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E%3F%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-shrink-0">
                        {isItemCompleted ? (
                          <CheckCircle className="text-green-500" size={14} />
                        ) : isItemFailed ? (
                          <AlertCircle className="text-red-500" size={14} />
                        ) : null}
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-gray-200 truncate flex-1 min-w-0">
                        {displayName}
                      </div>
                    </div>
                    
                    {/* Error Message */}
                    {isItemFailed && resultItem?.error && (
                      <div className="text-xs text-red-400 mt-1 line-clamp-2">{resultItem.error}</div>
                    )}
                  </div>
                  
                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    {isItemCompleted ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                        Success
                      </span>
                    ) : isItemFailed ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                        Failed
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500 py-8">
              {isWaiting || isActive ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={20} className="text-[#d94662] animate-spin" />
                  <span className="text-xs sm:text-sm text-neutral-400">{isWaiting ? 'Waiting in queue...' : 'Preparing download...'}</span>
                </div>
              ) : (
                <span className="text-xs sm:text-sm">No results available</span>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-white/5 bg-[#0e0e11] flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-medium text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            Close
          </button>
          
          {isCompleted ? (
            <button 
              onClick={handleDownload}
              className="w-full sm:w-auto sm:self-end px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition-colors"
            >
              <DownloadCloud size={18} />
              Download ZIP
            </button>
          ) : isFailed ? (
            <button 
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold text-sm transition-colors"
            >
              Close
            </button>
          ) : (
            <button 
              disabled
              className="w-full sm:w-auto px-4 py-2.5 bg-gray-700 text-gray-400 rounded-xl font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Loader2 size={18} className="animate-spin" />
              {isActive ? 'Downloading...' : 'Waiting...'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
