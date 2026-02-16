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
  const getSelectionKey = (item: SelectionItem, index: number) => `${item.video.url || item.video.id}-${index}`;
  const getPlatformLabel = (item: SelectionItem) => (item.video.platform || 'media').toUpperCase();
  const getPlatformPlaceholder = (item: SelectionItem) =>
    `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#1f2937"/>
          </linearGradient>
        </defs>
        <rect width="640" height="360" fill="url(#g)"/>
        <circle cx="320" cy="172" r="48" fill="rgba(255,255,255,0.14)"/>
        <polygon points="306,146 306,198 350,172" fill="#ffffff"/>
        <text x="320" y="288" text-anchor="middle" fill="#e5e7eb" font-family="Arial,sans-serif" font-size="22">${getPlatformLabel(item)}</text>
      </svg>`
    )}`;
  const isYouTubeLike = (item: SelectionItem) =>
    (item.video.platform || '').toLowerCase() === 'youtube'
    || /youtube|youtu\.be/i.test(item.video.url || '')
    || !/^https?:\/\//i.test(item.video.id);

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

  const selectionLabel = items.length === 1 ? t.itemSelected : t.itemsSelected;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm px-3 sm:px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-gradient-to-r from-black/40 via-black/30 to-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="p-5 sm:p-6 border-b border-white/10 bg-gradient-to-r from-black/50 to-black/30 flex-shrink-0">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {t.viewList}
              </h2>
              <div className="h-5 w-px bg-white/10"></div>
              <div className="bg-primary/20 text-primary px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border border-primary/30">
                {items.length} {selectionLabel}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="hidden md:flex flex-col gap-4">
            <div className="flex items-center gap-6">
              <span className="text-gray-300 text-sm whitespace-nowrap">
                {t.readyToProcess}
              </span>
            </div>
          </div>

          <div className="flex md:hidden flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-gray-300 text-xs whitespace-nowrap">
                {t.readyToProcess}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-[#050509]/50 px-5 sm:px-6 py-5">
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="text-center text-gray-500 py-16">
                <p className="text-sm">{t.noItemsSelected}</p>
              </div>
            ) : (
              items.map((item, index) => (
                <div
                  key={getSelectionKey(item, index)}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full p-4 rounded-xl bg-[#0b0b10]/80 border border-white/5 hover:border-white/10 hover:bg-[#0b0b10] transition-all backdrop-blur-sm"
                >
                  {/* Thumbnail */}
                  <div className="flex-shrink-0 w-full sm:w-24 md:w-28 h-20 sm:h-16 rounded-xl overflow-hidden bg-[#1a1a20] shadow-lg">
                    <img
                      src={item.video.thumbnail || (isYouTubeLike(item) ? `https://img.youtube.com/vi/${item.video.id}/hqdefault.jpg` : getPlatformPlaceholder(item))}
                      alt={item.video.title || t.metadataUnavailable}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = isYouTubeLike(item)
                          ? `https://img.youtube.com/vi/${item.video.id}/mqdefault.jpg`
                          : getPlatformPlaceholder(item);
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <h3 className="text-sm sm:text-base font-semibold text-white line-clamp-2 sm:line-clamp-1 mb-2" title={item.video.title}>
                      {item.video.title || t.metadataUnavailable}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-400">
                      <span className="truncate font-medium">{item.video.channel || t.unknownChannel}</span>
                      {item.video.duration && (
                        <>
                          <span className="text-gray-600">•</span>
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-gray-500" />
                            <span>{formatDuration(item.video.duration)}</span>
                          </div>
                        </>
                      )}
                      <span className="text-gray-600">•</span>
                      <span className="text-primary font-semibold">{item.format.toUpperCase()} {item.quality}</span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => onRemove(item)}
                    className="flex-shrink-0 p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all self-start sm:self-auto"
                    title={t.clearAll}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-5 sm:p-6 border-t border-white/10 bg-gradient-to-r from-black/50 to-black/30 flex-shrink-0">
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl text-sm font-medium transition-all"
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
