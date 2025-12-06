
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

  const handleFormatChange = (newFormat: VideoFormat) => {
    setFormat(newFormat);
    // Set default quality for new format
    setQuality(newFormat === 'mp3' ? '320k' : '1080p');
    setShowFormatMenu(false);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-zinc-900/90 px-6 py-4 rounded-xl shadow-xl backdrop-blur-lg border border-zinc-700/50 max-w-[90%]">
      
      {/* Count Badge */}
      <div className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm font-bold whitespace-nowrap">
        {count} {t.itemsSelected}
      </div>

      <div className="h-6 w-px bg-white/10"></div>

      {/* Status Text */}
      <span className="text-gray-400 text-sm whitespace-nowrap">
        {t.readyToProcess || 'İşleme hazır'}
      </span>

      <div className="h-6 w-px bg-white/10"></div>

      {/* View List Button */}
      <button
        onClick={onViewList}
        className="text-white bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
      >
        {t.viewList || 'Listeyi Gör'}
      </button>

      {/* Format Selector */}
      <div className="relative">
        <button 
          onClick={() => {
            setShowFormatMenu(!showFormatMenu);
            setShowQualityMenu(false);
          }}
          className="flex items-center gap-2 text-white bg-white/5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
        >
          <span className="uppercase text-gray-400">{t.formatLabel}:</span> {format.toUpperCase()}
          <ChevronDown size={14} className="text-gray-500" />
        </button>
        {showFormatMenu && (
          <div className="absolute bottom-full mb-2 left-0 w-full bg-[#1a1a20] border border-white/10 rounded-lg overflow-hidden z-20">
            <div onClick={() => handleFormatChange('mp3')} className="px-3 py-2 text-sm text-gray-300 hover:bg-white/10 cursor-pointer">MP3</div>
            <div onClick={() => handleFormatChange('mp4')} className="px-3 py-2 text-sm text-gray-300 hover:bg-white/10 cursor-pointer">MP4</div>
          </div>
        )}
      </div>

      {/* Quality Selector */}
      <div className="relative">
        <button 
          onClick={() => {
            setShowQualityMenu(!showQualityMenu);
            setShowFormatMenu(false);
          }}
          className="flex items-center gap-2 text-white bg-white/5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
        >
          <span className="text-gray-400">Quality:</span> {quality}
          <ChevronDown size={14} className="text-gray-500" />
        </button>
        {showQualityMenu && (
          <div className="absolute bottom-full mb-2 left-0 w-full bg-[#1a1a20] border border-white/10 rounded-lg overflow-hidden z-20 max-h-48 overflow-y-auto">
            {qualities.map((q) => (
              <div 
                key={q}
                onClick={() => {
                  setQuality(q);
                  setShowQualityMenu(false);
                }} 
                className={`px-3 py-2 text-sm hover:bg-white/10 cursor-pointer ${
                  quality === q ? 'text-primary font-bold' : 'text-gray-300'
                }`}
              >
                {q}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1"></div>

      {/* Actions */}
      <button 
        onClick={onClear}
        className="p-2 text-gray-500 hover:text-white transition-colors"
        title={t.clearAll}
      >
        <X size={20} />
      </button>

      <button 
        onClick={onDownload}
        className="bg-primary hover:bg-red-600 text-white px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
      >
        <Archive size={16} />
        {t.downloadZip}
      </button>
    </div>
  );
};
