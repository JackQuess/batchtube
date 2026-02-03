
import React from 'react';
import { DownloadItem, JobStatus, VideoResult } from '../types';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface DownloadListItemProps {
  item: DownloadItem;
  video?: VideoResult;
  t: {
    preparing: string;
    downloading: string;
    completed: string;
    failed: string;
  };
}

export const DownloadListItem: React.FC<DownloadListItemProps> = ({ item, video, t }) => {
  const getStatusText = (status: JobStatus, progress: number): string => {
    switch (status) {
      case 'idle':
      case 'queued':
        return t.preparing;
      case 'downloading':
        return `${t.downloading} (${Math.round(progress)}%)`;
      case 'processing':
        return t.preparing;
      case 'completed':
        return `${t.completed} ✔`;
      case 'failed':
        return `${t.failed} ❌`;
      default:
        return t.preparing;
    }
  };

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-[#22c55e]" />;
      case 'failed':
        return <XCircle size={16} className="text-red-500" />;
      case 'downloading':
      case 'processing':
        return <Loader2 size={16} className="text-[#f97316] animate-spin" />;
      default:
        return null;
    }
  };

  const thumbnail = video?.thumbnail || '';

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0b0b10] border border-white/5 hover:border-white/10 transition-colors">
      {/* Thumbnail */}
      {thumbnail && (
        <div className="w-16 h-10 rounded overflow-hidden flex-shrink-0 bg-gray-800">
          <img 
            src={thumbnail} 
            alt={video?.title || item.videoId} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-200 truncate">
          {video?.title || item.title || item.videoId}
        </div>
        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
          <span className="uppercase text-[10px] bg-white/5 px-1.5 py-0.5 rounded">
            {item.format}
          </span>
          <span>{getStatusText(item.status, item.progress)}</span>
        </div>
      </div>

      {/* Status Icon */}
      <div className="flex-shrink-0">
        {getStatusIcon(item.status)}
      </div>
    </div>
  );
};

