import React, { useState } from 'react';
import { Translations, VideoFormat, VideoQuality, MP4Quality, MP3Quality } from '../types';
import { X, Archive, ChevronDown } from 'lucide-react';

interface SelectionBarProps {
  count: number;
  format: VideoFormat;
  setFormat: (f: VideoFormat) => void;
  quality: VideoQuality;
  setQuality: (q: VideoQuality) => void;
  onClear: () => void;
  onDownload: () => void;
  onViewList: () => void;
  t: Translations;
}

const MP4_QUALITIES: MP4Quality[] = ['4K', '1440p', '1080p', '720p', '480p'];
const MP3_QUALITIES: MP3Quality[] = ['320k', '128k'];

export const SelectionBar: React.FC<SelectionBarProps> = ({
  count, format, setFormat, quality, setQuality, onClear, onDownload, onViewList, t
}) => {
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  if (count === 0) return null;

  const qualities = format === 'mp3' ? MP3_QUALITIES : MP4_QUALITIES;
  const selectionLabel = count === 1 ? t.itemSelected : t.itemsSelected;

  const handleFormatChange = (newFormat: VideoFormat) => {
    setFormat(newFormat);
    setQuality(newFormat === 'mp3' ? '320k' : '1080p');
    setShowFormatMenu(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto z-40 flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-zinc-900/90 px-4 pb-4 sm:pb-0 sm:px-6 py-3 sm:py-5 rounded-t-xl sm:rounded-xl shadow-xl backdrop-blur-lg border border-zinc-700/50 sm:w-[min(1100px,calc(100vw-24px))] sm:max-w-none">

      {/* Mobile Top Row */}
      <div className="flex items-center gap-2 sm:hidden justify-between w-full">
        <div className="bg-primary/10 text-primary px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap">
          {count} {selectionLabel}
        </div>
        <button
          onClick={onClear}
          className="p-1.5 text-gray-500 hover:text-white transition-colors"
          title={t.clearAll}
        >
          <X size={18} />
        </button>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between flex-nowrap w-full min-w-0">
        <div className="flex items-center gap-2 md:gap-4 flex-nowrap min-w-0">
          {/* Count Badge */}
          <div className="bg-primary/10 text-primary px-2 md:px-3 py-1 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap shrink-0">
            {count} {selectionLabel}
          </div>

          <div className="h-6 w-px bg-white/10 hidden md:block shrink-0"></div>

          {/* Status Text */}
          <span className="text-gray-400 text-xs sm:text-sm whitespace-nowrap hidden md:inline min-w-0 truncate">
            {t.readyToProcess}
          </span>

          <div className="h-6 w-px bg-white/10 hidden md:block shrink-0"></div>

          {/* View List Button */}
          <button
            onClick={onViewList}
            className="text-white bg-white/5 hover:bg-white/10 px-3 md:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0"
          >
            {t.viewList}
          </button>

          {/* Format Selector */}
          <div className="relative shrink-0">
            <button
              onClick={() => {
                setShowFormatMenu(!showFormatMenu);
                setShowQualityMenu(false);
              }}
              className="flex items-center gap-1 md:gap-2 text-white bg-white/5 px-2 md:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              <span className="uppercase text-gray-400 hidden sm:inline">{t.formatLabel}:</span>
              <span className="uppercase text-gray-400 sm:hidden">{t.formatShort}:</span>
              {format.toUpperCase()}
              <ChevronDown size={12} className="text-gray-500" />
            </button>
            {showFormatMenu && (
              <div className="absolute bottom-full mb-2 left-0 w-full bg-[#1a1a20] border border-white/10 rounded-lg overflow-hidden z-20 min-w-[80px]">
                <div onClick={() => handleFormatChange('mp3')} className="px-3 py-2 text-xs sm:text-sm text-gray-300 hover:bg-white/10 cursor-pointer">MP3</div>
                <div onClick={() => handleFormatChange('mp4')} className="px-3 py-2 text-xs sm:text-sm text-gray-300 hover:bg-white/10 cursor-pointer">MP4</div>
              </div>
            )}
          </div>

          {/* Quality Selector */}
          <div className="relative shrink-0">
            <button
              onClick={() => {
                setShowQualityMenu(!showQualityMenu);
                setShowFormatMenu(false);
              }}
              className="flex items-center gap-1 md:gap-2 text-white bg-white/5 px-2 md:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              <span className="text-gray-400 hidden sm:inline">{t.qualityLabel}:</span>
              <span className="text-gray-400 sm:hidden">{t.qualityShort}:</span>
              {quality}
              <ChevronDown size={12} className="text-gray-500" />
            </button>
            {showQualityMenu && (
              <div className="absolute bottom-full mb-2 left-0 w-full bg-[#1a1a20] border border-white/10 rounded-lg overflow-hidden z-20 max-h-48 overflow-y-auto min-w-[100px]">
                {qualities.map((q) => (
                  <div
                    key={q}
                    onClick={() => {
                      setQuality(q);
                      setShowQualityMenu(false);
                    }}
                    className={`px-3 py-2 text-xs sm:text-sm hover:bg-white/10 cursor-pointer ${
                      quality === q ? 'text-primary font-bold' : 'text-gray-300'
                    }`}
                  >
                    {q}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-nowrap shrink-0">
          <button
            onClick={onClear}
            className="p-2 text-gray-500 hover:text-white transition-colors hidden md:block shrink-0"
            title={t.clearAll}
          >
            <X size={18} />
          </button>

          <button
            onClick={onDownload}
            className="bg-primary hover:bg-red-600 text-white px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 whitespace-nowrap shrink-0"
          >
            <Archive size={16} />
            {t.downloadZip}
          </button>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex md:hidden flex-col gap-3 w-full">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onViewList}
            className="text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
          >
            {t.viewList}
          </button>
          <div className="relative">
            <button
              onClick={() => {
                setShowFormatMenu(!showFormatMenu);
                setShowQualityMenu(false);
              }}
              className="text-white bg-white/5 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors"
            >
              {format.toUpperCase()}
            </button>
            {showFormatMenu && (
              <div className="absolute bottom-full mb-2 left-0 w-full bg-[#1a1a20] border border-white/10 rounded-lg overflow-hidden z-20 min-w-[80px]">
                <div onClick={() => handleFormatChange('mp3')} className="px-3 py-2 text-xs text-gray-300 hover:bg-white/10 cursor-pointer">MP3</div>
                <div onClick={() => handleFormatChange('mp4')} className="px-3 py-2 text-xs text-gray-300 hover:bg-white/10 cursor-pointer">MP4</div>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => {
                setShowQualityMenu(!showQualityMenu);
                setShowFormatMenu(false);
              }}
              className="text-white bg-white/5 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors"
            >
              {quality}
            </button>
            {showQualityMenu && (
              <div className="absolute bottom-full mb-2 left-0 w-full bg-[#1a1a20] border border-white/10 rounded-lg overflow-hidden z-20 max-h-48 overflow-y-auto min-w-[100px]">
                {qualities.map((q) => (
                  <div
                    key={q}
                    onClick={() => {
                      setQuality(q);
                      setShowQualityMenu(false);
                    }}
                    className={`px-3 py-2 text-xs hover:bg-white/10 cursor-pointer ${
                      quality === q ? 'text-primary font-bold' : 'text-gray-300'
                    }`}
                  >
                    {q}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onDownload}
          className="w-full bg-primary hover:bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <Archive size={16} />
          {t.downloadZip}
        </button>
      </div>
    </div>
  );
};
