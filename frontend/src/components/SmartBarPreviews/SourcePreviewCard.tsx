import React from 'react';
import { Video } from 'lucide-react';
import { getProviderIcon, getProviderColorClass } from '../../lib/providerDisplay';

export interface SourcePreviewCardProps {
  type: 'channel' | 'playlist' | 'profile';
  label: string;
  url: string;
  provider: string;
  thumbnail?: string | null;
  itemCount?: number | null;
  className?: string;
}

export function SourcePreviewCard({
  type,
  label,
  url,
  provider,
  thumbnail,
  itemCount,
  className = ''
}: SourcePreviewCardProps) {
  const Icon = getProviderIcon(provider);
  const color = getProviderColorClass(provider);
  const typeLabel = type === 'channel' ? 'Channel' : type === 'playlist' ? 'Playlist' : 'Profile';
  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  })();
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border border-app-border bg-white/5 ${className}`}>
      <div className={`w-16 h-16 rounded-xl border flex items-center justify-center shrink-0 overflow-hidden ${color}`}>
        {thumbnail ? (
          <img src={thumbnail} alt="" className="w-full h-full object-cover" />
        ) : (
          <Icon className="w-8 h-8 text-app-muted" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-app-primary uppercase tracking-wider">{typeLabel}</span>
          <span className="text-[10px] text-app-muted">{host}</span>
        </div>
        <p className="text-sm font-medium text-white truncate mt-0.5">{label || host}</p>
        {itemCount != null && (
          <p className="text-xs text-app-muted mt-0.5">~{itemCount} items</p>
        )}
      </div>
    </div>
  );
}
