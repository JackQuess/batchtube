import React from 'react';
import { SelectionItem, Translations } from '../types';
import { X, Trash2, Clock } from 'lucide-react';

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: SelectionItem[];
  onRemove: (item: SelectionItem) => void;
  t: Translations;
}

export const SelectionModal: React.FC<SelectionModalProps> = ({
  isOpen,
  onClose,
  items,
  onRemove,
  t
}) => {
  if (!isOpen) return null;

  // Format duration helper
  const formatDuration = (duration: string | number): string => {
    if (!duration) return '';
    if (typeof duration === 'string' && duration.includes(':')) {
      return duration;
    }
    const seconds = typeof duration === 'string' ? parseInt(duration, 10) : duration;
    if (isNaN(seconds) || seconds < 0) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    const pad = (num: number) => num.toString().padStart(2, '0');
    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(remainingSeconds)}`;
    }
    return `${minutes}:${pad(remainingSeconds)}`;
  };

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm px-3 sm:px-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[640px] bg-[#0b0b10] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-white/5 bg-[#0b0b10] flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-0.5 sm:mb-1">
              {t.viewList || 'View List'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              {items.length} {items.length === 1 ? (t.itemsSelected?.replace('Videos', 'Video') || 'item') : (t.itemsSelected || 'items')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-[#050509] max-h-[50vh]">
          <div className="flex flex-col items-center justify-center w-full gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4">
            {items.length === 0 ? (
              <div className="text-center text-gray-500 py-12 w-full">
                <p className="text-sm sm:text-base">{t.itemsSelected?.replace('Videos', 'No videos') || 'No items selected'}</p>
              </div>
            ) : (
              items.map((item, index) => (
                <div
                  key={`${item.video.id}-${index}`}
                  className="w-full max-w-[520px] flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-[#0b0b10] border border-white/5 hover:border-white/10 transition-colors"
                >
                {/* Thumbnail */}
                <div className="relative flex-shrink-0 w-full sm:w-20 md:w-24 h-16 rounded-lg overflow-hidden bg-[#1a1a20]">
                  <img
                    src={item.video.thumbnail || `https://img.youtube.com/vi/${item.video.id}/hqdefault.jpg`}
                    alt={item.video.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://img.youtube.com/vi/${item.video.id}/mqdefault.jpg`;
                    }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 w-full sm:w-auto">
                  <h3 className="text-white font-medium text-xs sm:text-sm mb-1 line-clamp-2 sm:truncate" title={item.video.title}>
                    {item.video.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 text-[11px] sm:text-xs text-gray-400">
                    <span className="truncate">{item.video.channel || 'Unknown Channel'}</span>
                    {item.video.duration && (
                      <>
                        <span className="text-gray-600">•</span>
                        <div className="flex items-center gap-1">
                          <Clock size={10} className="sm:w-3 sm:h-3" />
                          <span>{formatDuration(item.video.duration)}</span>
                        </div>
                      </>
                    )}
                    <span className="text-gray-600">•</span>
                    <span className="text-primary">{item.format.toUpperCase()} {item.quality}</span>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => onRemove(item)}
                  className="flex-shrink-0 p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors self-start sm:self-auto"
                  title={t.clearAll || 'Remove'}
                >
                  <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
            ))
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

