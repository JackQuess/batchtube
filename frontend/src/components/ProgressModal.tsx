/**
 * BatchTube 2.0 - Progress Modal
 * Premium UI for batch download progress tracking
 */
import React, { useEffect, useState } from 'react';
import { batchAPI, BatchJobStatus } from '../services/batchAPI';
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
  const [status, setStatus] = useState<BatchJobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  // Poll job status every 2 seconds
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
        setError(err instanceof Error ? err.message : 'Failed to get status');
        setIsPolling(false);
      }
    }, 2000);

    // Initial fetch
    batchAPI.getStatus(jobId)
      .then(setStatus)
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to get status');
        setIsPolling(false);
      });

    return () => clearInterval(pollInterval);
  }, [jobId, isPolling]);

  const handleDownload = () => {
    const downloadUrl = batchAPI.getDownloadUrl(jobId);
    window.location.href = downloadUrl;
  };

  if (error && !status) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="w-full max-w-md bg-[#141418] border border-white/10 rounded-2xl shadow-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-red-500" size={24} />
            <h2 className="text-xl font-bold text-white">Error</h2>
          </div>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-colors"
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

  const progress = status?.progress || 0;
  const result = status?.result;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#141418] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-[#0e0e11]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {isCompleted ? <CheckCircle className="text-green-500" size={24} /> : 
               isFailed ? <AlertCircle className="text-red-500" size={24} /> : 
               <Loader2 className="animate-spin text-[#d94662]" size={24} />}
              
              {isCompleted ? 'Batch Completed' : 
               isFailed ? 'Batch Failed' : 
               isActive ? 'Downloading...' : 
               'Preparing...'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">
                {result ? `${result.succeeded} / ${result.total} succeeded` : 
                 `${totalItems} items`}
              </span>
              <span className="text-gray-400 font-bold">
                {progress}%
              </span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  isCompleted ? 'bg-green-500' : 
                  isFailed ? 'bg-red-500' : 
                  'bg-[#d94662]'
                }`} 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#0e0e11]">
          {result && result.results.length > 0 ? (
            result.results.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center gap-3 p-3 rounded-lg bg-[#141418] border border-white/5"
              >
                <div className="flex-shrink-0">
                  {item.status === 'success' ? (
                    <CheckCircle className="text-green-500" size={20} />
                  ) : (
                    <AlertCircle className="text-red-500" size={20} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-200">
                    Item {item.id + 1}
                  </div>
                  {item.status === 'failed' && item.error && (
                    <div className="text-xs text-red-400 mt-1">{item.error}</div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    item.status === 'success' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {item.status === 'success' ? 'Success' : 'Failed'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              {isWaiting || isActive ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={20} className="text-[#d94662] animate-spin" />
                  <span>{isWaiting ? 'Waiting in queue...' : 'Downloading items...'}</span>
                </div>
              ) : (
                <span>No results available</span>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/5 bg-[#0e0e11] flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            Close
          </button>
          
          {isCompleted ? (
            <button 
              onClick={handleDownload}
              className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition-colors"
            >
              <DownloadCloud size={18} />
              Download ZIP
            </button>
          ) : isFailed ? (
            <button 
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-colors"
            >
              Close
            </button>
          ) : (
            <button 
              disabled
              className="flex-1 py-3 bg-gray-700 text-gray-400 rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2"
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

