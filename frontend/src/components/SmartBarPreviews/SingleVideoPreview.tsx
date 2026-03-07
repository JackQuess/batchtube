import React, { useState, useMemo } from 'react';
import { Video, Music, Download, List } from 'lucide-react';
import type { DetectionResult } from '../../lib/sourceDetection';
import { getProviderIcon, getProviderBadgeSolidClass } from '../../lib/providerDisplay';
import { getVideoThumbnailUrl } from '../../lib/videoThumbnail';

export interface SingleVideoPreviewProps {
  detection: DetectionResult & { type: 'single_video' };
  onDownload: () => void;
  onAddToBatch: () => void;
  onExtractAudio?: () => void;
  title?: string | null;
  thumbnail?: string | null;
  duration?: string | null;
}

export function SingleVideoPreview({
  detection,
  onDownload,
  onAddToBatch,
  onExtractAudio,
  title,
  thumbnail,
  duration
}: SingleVideoPreviewProps) {
  const [quality, setQuality] = useState<'1080p' | '720p' | 'best'>('1080p');
  const provider = detection.provider ?? 'generic';
  const Icon = getProviderIcon(provider) ?? Video;
  const badgeClass = getProviderBadgeSolidClass(provider);
  const thumbnailUrl = useMemo(
    () => thumbnail ?? (detection.url ? getVideoThumbnailUrl(detection.url, provider) : null),
    [thumbnail, detection.url, provider]
  );
  const host = detection.url ? (() => {
    try {
      return new URL(detection.url).hostname;
    } catch {
      return detection.url;
    }
  })() : '';

  return (
    <div className="border-t border-app-border/50 overflow-hidden">
      <div className="p-4 flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-black/50 border border-white/10 shrink-0">
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center">
                <Icon className="w-8 h-8 text-app-muted" />
              </div>
            )}
            <div className={`absolute top-1 left-1 ${badgeClass} p-1 rounded-md`}>
              <Icon className="w-3 h-3 text-white" />
            </div>
            {duration && (
              <span className="absolute bottom-1 right-1 text-[10px] font-medium bg-black/70 px-1.5 py-0.5 rounded">
                {duration}
              </span>
            )}
          </div>
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <h3 className="text-sm font-medium text-white line-clamp-2 leading-snug">
              {title || host || 'Video'}
            </h3>
            <span className="text-xs text-app-muted mt-1">1 credit</span>
            <div className="mt-2 flex items-center gap-2">
              <label className="text-[10px] text-app-muted">Quality</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as '1080p' | '720p' | 'best')}
                className="text-[10px] bg-white/5 border border-app-border rounded px-2 py-1 text-white"
              >
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="best">Best</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onDownload}
            className="flex-1 min-w-[120px] bg-app-primary hover:bg-app-primary-hover text-white text-sm font-medium py-2 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Download
          </button>
          <button
            type="button"
            onClick={onAddToBatch}
            className="flex-1 min-w-[120px] bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <List className="w-4 h-4" /> Add to batch
          </button>
          {onExtractAudio && (
            <button
              type="button"
              onClick={onExtractAudio}
              className="px-3 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg transition-all flex items-center justify-center"
              title="Extract audio"
            >
              <Music className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
