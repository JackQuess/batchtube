import React from 'react';
import { useJobPolling } from '../hooks/useJobPolling';
import { Translations } from '../types';
import { API_BASE_URL } from '../config/api';
import { Loader2, CheckCircle, AlertCircle, FileVideo, DownloadCloud } from 'lucide-react';

interface DownloadModalProps {
  jobId: string;
  onClose: () => void;
  t: Translations;
  initialItemCount?: number;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ jobId, onClose, t, initialItemCount }) => {
  const { data, error } = useJobPolling(jobId);

  const totalItems = data?.totalItems || initialItemCount || 0;
  const completedItems = data?.completedItems || 0;

  const handleDownloadFile = async () => {
    if (!data?.downloadUrl) {
      console.error('[DownloadModal] No downloadUrl available. Status:', data?.status);
      return;
    }

    const downloadUrl = data.downloadUrl.startsWith('http')
      ? data.downloadUrl
      : `${API_BASE_URL}${data.downloadUrl}`;

    try {
      const response = await fetch(downloadUrl, {
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BatchTube_${jobId}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[DownloadModal] Download error:', error);
      window.location.href = downloadUrl;
    }
  };

  if (!data && !error) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-[#0b0b10] p-8 rounded-2xl border border-white/10 flex flex-col items-center">
          <Loader2 className="animate-spin text-primary mb-4" size={32} />
          <span className="text-gray-400 animate-pulse">{t.preparing}</span>
        </div>
      </div>
    );
  }

  const isCompleted = data?.status === 'completed';
  const isFailed = data?.status === 'failed';
  const isRunning = data?.status === 'downloading' || data?.status === 'processing';
  const isPreparing = !data || (data.status !== 'completed' && data.status !== 'failed' && !isRunning);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#0b0b10] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-[#0b0b10]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            {isCompleted ? <CheckCircle className="text-green-500" /> :
              isFailed ? <AlertCircle className="text-red-500" /> :
                <Loader2 className="animate-spin text-primary" />}

            {isCompleted ? t.completed :
              isFailed ? t.failed :
                isRunning ? (data?.status === 'processing' ? t.processing : t.downloading) : t.preparing}
          </h2>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">
                {completedItems} / {totalItems} {t.itemsLabel}
              </span>
              <span className="text-gray-400 font-bold">
                {data?.overallPercent || 0}%
              </span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isCompleted ? 'bg-green-500' :
                    isFailed ? 'bg-red-500' :
                      'bg-primary'
                }`}
                style={{ width: `${data?.overallPercent || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#050509]">
          {data?.items && data.items.length > 0 ? (
            data.items.map((item) => (
              <div key={item.index} className="flex items-center gap-3 p-3 rounded-lg bg-[#0b0b10] border border-white/5">
                <div className="p-2 bg-white/5 rounded-lg text-gray-400 flex-shrink-0">
                  <FileVideo size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-200 truncate">{item.title}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                    {(item.status === 'downloading' || item.status === 'queued') && (
                      <>
                        <span>{item.percent.toFixed(0)}%</span>
                        {item.speed && item.speed !== '0 B/s' && (
                          <>
                            <span className="text-gray-600">•</span>
                            <span>{item.speed}</span>
                          </>
                        )}
                        {item.eta && item.eta !== '--' && (
                          <>
                            <span className="text-gray-600">•</span>
                            <span>{item.eta}</span>
                          </>
                        )}
                      </>
                    )}
                    {item.status === 'completed' && item.fileName && (
                      <span className="text-green-500">{item.fileName}</span>
                    )}
                    {item.status === 'failed' && item.error && (
                      <span className="text-red-500">{item.error}</span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {item.status === 'completed' && <CheckCircle size={18} className="text-green-500" />}
                  {item.status === 'failed' && <AlertCircle size={18} className="text-red-500" />}
                  {(item.status === 'downloading' || item.status === 'processing') && <Loader2 size={18} className="text-primary animate-spin" />}
                  {item.status === 'queued' && <span className="text-gray-600 text-xs">...</span>}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              {isPreparing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={20} className="text-primary animate-spin" />
                  <span>{t.preparing}</span>
                </div>
              ) : totalItems > 0 ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={20} className="text-primary animate-spin" />
                  <span>{t.downloading}</span>
                </div>
              ) : (
                <span>{t.noResultsAvailable}</span>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/5 bg-[#0b0b10] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            {t.close}
          </button>

          {isCompleted && data?.downloadUrl ? (
            <button
              onClick={handleDownloadFile}
              className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold shadow-lg shadow-green-900/20 flex items-center justify-center gap-2"
            >
              <DownloadCloud size={18} />
              {t.saveFile}
            </button>
          ) : isFailed ? (
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
            >
              {t.close}
            </button>
          ) : (
            <button
              disabled
              className="flex-1 py-3 bg-gray-700 text-gray-400 rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Loader2 size={18} className="animate-spin" />
              {isRunning ? t.downloading : t.preparing}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
