import React from 'react';
import { Download, List, CheckSquare } from 'lucide-react';
import type { DetectionResult } from '../../lib/sourceDetection';
import { SourcePreviewCard } from './SourcePreviewCard';

export type SourcePreviewKind = 'channel' | 'playlist' | 'profile';

export interface ChannelPlaylistProfilePreviewProps {
  detection: DetectionResult & { type: 'channel' | 'playlist' | 'profile' };
  onDownloadLatest: (n?: number) => void;
  onDownloadAll: () => void;
  onSelectManually: () => void;
  onAddAsAgent?: () => void;
  sourceTitle?: string | null;
  sourceThumbnail?: string | null;
  sourceItemCount?: number | null;
}

const LATEST_OPTIONS = [10, 25, 50] as const;

export function ChannelPlaylistProfilePreview({
  detection,
  onDownloadLatest,
  onDownloadAll,
  onSelectManually,
  onAddAsAgent,
  sourceTitle,
  sourceThumbnail,
  sourceItemCount
}: ChannelPlaylistProfilePreviewProps) {
  const kind = detection.type;
  const label = sourceTitle ?? detection.sourceLabel ?? (kind === 'channel' ? 'Channel' : kind === 'playlist' ? 'Playlist' : 'Profile');
  const url = detection.sourceUrl ?? '';
  const provider = detection.provider ?? 'generic';

  return (
    <div className="border-t border-app-border/50 overflow-hidden">
      <div className="p-4 flex flex-col gap-4">
        <SourcePreviewCard
          type={kind}
          label={label}
          url={url}
          provider={provider}
          thumbnail={sourceThumbnail}
          itemCount={sourceItemCount}
        />
        <div className="text-xs font-medium text-app-muted uppercase tracking-wider">
          Quick choices
        </div>
        <div className="flex flex-wrap gap-2">
          {LATEST_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onDownloadLatest(n)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
            >
              Latest {n}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onDownloadAll()}
            className="flex-1 min-w-[140px] bg-app-primary hover:bg-app-primary-hover text-white text-sm font-medium py-2 rounded-lg transition-all"
          >
            <Download className="w-4 h-4 inline mr-2" />
            Download all
          </button>
          <button
            type="button"
            onClick={onSelectManually}
            className="flex-1 min-w-[140px] bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <CheckSquare className="w-4 h-4" /> Select manually
          </button>
          {onAddAsAgent && (
            <button
              type="button"
              onClick={onAddAsAgent}
              className="flex-1 min-w-[100px] bg-white/5 hover:bg-white/10 text-white text-sm font-medium py-2 rounded-lg transition-all opacity-75"
              title="Coming soon"
            >
              Add as agent
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
