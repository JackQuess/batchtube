import React from 'react';
import { DownloadTask, JobStatus, VideoFormat } from '../types';
import { X, Trash2, PlayCircle, FolderArchive, Loader2, Music, Video, CheckCircle, AlertCircle } from 'lucide-react';

interface BatchQueueProps {
  queue: DownloadTask[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onStart: () => void;
  isProcessing: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  translations: any;
}

export const BatchQueue: React.FC<BatchQueueProps> = ({ 
  queue, 
  onRemove, 
  onClear, 
  onStart, 
  isProcessing,
  isOpen,
  setIsOpen,
  translations
}) => {
  const pendingCount = queue.filter(t => t.status === 'queued').length;
  const completedCount = queue.filter(t => t.status === 'completed').length;

  if (!isOpen && queue.length === 0) return null;

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && queue.length > 0 && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-2xl shadow-primary/30 hover:scale-105 transition-transform z-50 flex items-center gap-2 group"
        >
          <FolderArchive size={24} />
          <span className="absolute -top-1 -right-1 bg-white text-primary text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
            {queue.length}
          </span>
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap px-0 group-hover:px-1">
            {translations.queueTitle}
          </span>
        </button>
      )}

      {/* Queue Panel */}
      <div 
        className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-surface/95 backdrop-blur-xl border-l border-gray-800 transform transition-transform duration-300 ease-in-out z-50 flex flex-col shadow-2xl ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FolderArchive className="text-primary" size={20} />
              {translations.queueTitle}
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              {queue.length} items • {completedCount} completed
            </p>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-text-secondary"
          >
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {queue.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-text-secondary text-sm">
               <FolderArchive size={40} className="mb-4 opacity-20" />
               <p>Queue is empty</p>
             </div>
          ) : (
            queue.map(task => (
              <div key={task.id} className="bg-background/50 border border-gray-800 rounded-lg p-3 relative overflow-hidden group">
                {/* Progress Bar Background */}
                {(task.status === 'downloading' || task.status === 'completed') && (
                  <div 
                    className={`absolute bottom-0 left-0 h-1 transition-all duration-300 ${
                      task.status === 'completed' ? 'bg-green-500' : 'bg-primary'
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                )}
                
                <div className="flex gap-3">
                  <div className="w-16 h-10 rounded overflow-hidden flex-shrink-0 bg-gray-800">
                     <img src={task.video.thumbnail} alt="" className="w-full h-full object-cover opacity-80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-text-primary truncate">{task.video.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                        task.format === 'mp3' 
                          ? 'border-blue-900/50 text-blue-400 bg-blue-900/10' 
                          : 'border-purple-900/50 text-purple-400 bg-purple-900/10'
                      }`}>
                        {task.format}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {task.status === 'idle' && 'Waiting'}
                        {task.status === 'queued' && 'Queued'}
                        {task.status === 'downloading' && `${Math.round(task.progress)}%`}
                        {task.status === 'completed' && 'Saved'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Status Icons / Actions */}
                  <div className="flex items-center">
                    {task.status === 'downloading' && (
                      <Loader2 size={16} className="text-primary animate-spin" />
                    )}
                    {task.status === 'completed' && (
                      <CheckCircle size={16} className="text-green-500" />
                    )}
                    {task.status === 'failed' && (
                      <AlertCircle size={16} className="text-red-500" />
                    )}
                    {(task.status === 'idle' || task.status === 'queued') && (
                      <button 
                        onClick={() => onRemove(task.id)}
                        className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded text-text-secondary transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {queue.length > 0 && (
          <div className="p-4 border-t border-gray-800 bg-surface/95 backdrop-blur">
            <div className="flex gap-3">
              <button 
                onClick={onClear}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-lg border border-gray-700 text-text-secondary hover:bg-gray-800 hover:text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {translations.clearQueue}
              </button>
              <button 
                onClick={onStart}
                disabled={isProcessing || pendingCount === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <PlayCircle size={16} />
                    {translations.startBatch} ({pendingCount})
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};