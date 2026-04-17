import React, { useState, useMemo } from 'react';
import { Video, Headphones, Film, Download, List } from 'lucide-react';
import type { DetectionResult } from '../../lib/sourceDetection';
import { getProviderIcon, getProviderBadgeSolidClass } from '../../lib/providerDisplay';
import { getVideoThumbnailUrl } from '../../lib/videoThumbnail';

export type SingleVideoFormat = 'mp4' | 'mp3' | 'mkv';
export type SingleVideoQuality = 'best' | '720p' | '1080p' | '4k';

/** Instagram carousel still URLs use `img_index`; we do not yet branch the UI to image-only formats. */
function getInstagramCarouselImageHint(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./i, '');
    if (!host.endsWith('instagram.com')) return null;
    if (!/\/p\//i.test(u.pathname)) return null;
    if (!u.searchParams.has('img_index')) return null;
    return 'Carousel still (`img_index`). The app does not auto-switch to a photo workflow yet; formats stay MP4/MKV/MP3 (no JPG picker).';
  } catch {
    return null;
  }
}

export interface SingleVideoPreviewProps {
  detection: DetectionResult & { type: 'single_video' };
  onDownload: (opts: { format: SingleVideoFormat; quality: SingleVideoQuality }) => void;
  onAddToBatch: (opts: { format: SingleVideoFormat; quality: SingleVideoQuality }) => void;
  onExtractAudio?: () => void;
  title?: string | null;
  thumbnail?: string | null;
  duration?: string | null;
}

const FORMAT_OPTIONS: { id: SingleVideoFormat; label: string; icon: React.ReactNode }[] = [
  { id: 'mp4', label: 'MP4', icon: <Video className="w-3.5 h-3.5" /> },
  { id: 'mp3', label: 'MP3', icon: <Headphones className="w-3.5 h-3.5" /> },
  { id: 'mkv', label: 'MKV', icon: <Film className="w-3.5 h-3.5" /> }
];

const QUALITY_OPTIONS: { id: SingleVideoQuality; label: string }[] = [
  { id: 'best', label: 'Best' },
  { id: '720p', label: '720p' },
  { id: '1080p', label: '1080p' },
  { id: '4k', label: '4K' }
];

export function SingleVideoPreview({
  detection,
  onDownload,
  onAddToBatch,
  onExtractAudio,
  title,
  thumbnail,
  duration
}: SingleVideoPreviewProps) {
  const [format, setFormat] = useState<SingleVideoFormat>('mp4');
  const [quality, setQuality] = useState<SingleVideoQuality>('best');
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
  const isAudio = format === 'mp3';
  const opts = { format, quality: isAudio ? 'best' as const : quality };
  const instagramCarouselHint = useMemo(
    () => (provider === 'instagram' ? getInstagramCarouselImageHint(detection.url) : null),
    [provider, detection.url]
  );

  return (
    <div className="border-t border-white/10 overflow-hidden">
      <div className="p-4 flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="relative w-32 h-20 rounded-xl overflow-hidden bg-black/50 border border-white/10 shrink-0">
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
          <div className="flex flex-col justify-center min-w-0 flex-1 gap-2">
            <h3 className="text-sm font-medium text-white line-clamp-2 leading-snug">
              {title || host || 'Video'}
            </h3>
            <span className="text-xs text-app-muted">1 credit</span>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-[10px] text-app-muted uppercase font-semibold">Format</span>
              <div className="flex gap-1">
                {FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormat(opt.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold transition-all ${
                      format === opt.id
                        ? 'bg-app-primary/20 text-app-primary border-app-primary/50'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-app-muted uppercase font-semibold">Quality</span>
              {isAudio ? (
                <span className="text-[10px] text-gray-400">Best audio</span>
              ) : (
                <div className="flex gap-1 flex-wrap">
                  {QUALITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setQuality(opt.id)}
                      className={`px-2 py-1 rounded-lg border text-[10px] font-semibold transition-all ${
                        quality === opt.id
                          ? 'bg-app-primary/20 text-app-primary border-app-primary/50'
                          : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {instagramCarouselHint ? (
              <p className="text-[10px] text-app-muted leading-snug">{instagramCarouselHint}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onDownload(opts)}
            className="flex-1 min-w-[120px] bg-app-primary hover:bg-app-primary-hover text-white text-sm font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Download
          </button>
          <button
            type="button"
            onClick={() => onAddToBatch(opts)}
            className="flex-1 min-w-[120px] bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <List className="w-4 h-4" /> Add to batch
          </button>
          {onExtractAudio && (
            <button
              type="button"
              onClick={onExtractAudio}
              className="px-3 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all flex items-center justify-center"
              title="Extract audio"
            >
              <Headphones className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
