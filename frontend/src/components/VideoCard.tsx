
import React from 'react';
import { VideoResult, VideoFormat, VideoQuality, Translations } from '../types';
import { Play, CheckCircle } from 'lucide-react';

interface VideoCardProps {
  video: VideoResult;
  isSelected: boolean;
  onSelect: (format: VideoFormat, quality: VideoQuality) => void;
  t: Translations;
}

export const VideoCard: React.FC<VideoCardProps> = ({ 
  video, 
  isSelected, 
  onSelect, 
  t 
}) => {
  // Use simple YT static image
  const getThumbnailUrl = () => {
    return `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
  };

  const handleThumbnailError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const videoId = video.id;
    
    // Prevent infinite loop
    if (target.dataset.fallbackAttempted === 'true') {
      // All fallbacks failed, use a placeholder
      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="640" height="360"%3E%3Crect fill="%23111" width="640" height="360"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo thumbnail%3C/text%3E%3C/svg%3E';
      return;
    }
    
    // Try fallback thumbnails in order
    const fallbacks = [
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
      `https://img.youtube.com/vi/${videoId}/default.jpg`
    ];
    
    const currentSrc = target.src;
    const currentIndex = fallbacks.findIndex(url => currentSrc.includes(url.split('/').pop() || ''));
    
    if (currentIndex < fallbacks.length - 1) {
      // Try next fallback
      target.src = fallbacks[currentIndex + 1];
    } else {
      // Mark as attempted and use placeholder
      target.dataset.fallbackAttempted = 'true';
      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="640" height="360"%3E%3Crect fill="%23111" width="640" height="360"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo thumbnail%3C/text%3E%3C/svg%3E';
    }
  };

  const formatDuration = (duration: string): string => {
    if (!duration || duration === 'Unknown' || duration === 'NA') {
      return '';
    }

    // If already in MM:SS or HH:MM:SS format, return as is
    if (duration.includes(':')) {
      return duration;
    }

    // If it's a number (seconds), convert to MM:SS
    const seconds = parseInt(duration, 10);
    if (isNaN(seconds)) {
      return '';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const handleClick = () => {
    // Use default format/quality (will use SelectionBar settings)
    onSelect('mp4', '1080p');
  };

  const formattedDuration = formatDuration(video.duration || '');

  return (
    <div 
      onClick={handleClick}
      className={`group relative bg-[#0b0b10] rounded-xl overflow-hidden border transition-all duration-300 cursor-pointer flex flex-col touch-manipulation
        ${isSelected ? 'border-primary ring-1 ring-primary shadow-lg shadow-primary/10' : 'border-white/5 hover:border-white/20'}
      `}
    >
      {/* Thumbnail */}
      <div className="relative w-full overflow-hidden rounded-t-xl">
        <div className="relative pt-[56.25%]">
          <img 
            src={getThumbnailUrl()} 
            alt={video.title} 
            className="absolute inset-0 w-full h-full object-cover"
            onError={handleThumbnailError}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none sm:pointer-events-auto">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-transform duration-300 ${isSelected ? 'bg-primary scale-110' : 'bg-white/10 scale-90'}`}>
              {isSelected ? <CheckCircle className="text-white" size={20} /> : <Play className="text-white fill-white" size={20} />}
            </div>
          </div>
          {formattedDuration && (
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-mono">
              {formattedDuration}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow gap-2">
        <h3 className="text-white font-medium text-sm sm:text-base line-clamp-2 leading-snug" title={video.title}>
          {video.title}
        </h3>
        <div className="flex flex-wrap items-center gap-1 text-xs sm:text-[13px] text-gray-500">
          <span className="truncate">{video.channel || 'Unknown Channel'}</span>
        </div>
        
        <div className="mt-auto flex items-center justify-between pt-2 sm:pt-3 border-t border-white/5">
          <span className={`text-[10px] sm:text-xs font-bold transition-colors ${isSelected ? 'text-primary' : 'text-gray-600'}`}>
            {isSelected ? t.selected.toUpperCase() : t.addToBatch.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};
