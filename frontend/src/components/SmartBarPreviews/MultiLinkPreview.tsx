import React from 'react';
import { Download, List, Eye } from 'lucide-react';
import type { DetectionResult } from '../../lib/sourceDetection';
import { ProviderGroupSummary } from './ProviderGroupSummary';
import { InvalidLinksPanel } from './InvalidLinksPanel';

export interface MultiLinkPreviewProps {
  detection: DetectionResult & { type: 'multiple_links' };
  onDownloadAll: () => void;
  onCreateBatch: () => void;
  onPreviewItems?: () => void;
  onClearInvalid?: () => void;
  estimatedCredits?: number;
}

export function MultiLinkPreview({
  detection,
  onDownloadAll,
  onCreateBatch,
  onPreviewItems,
  onClearInvalid,
  estimatedCredits
}: MultiLinkPreviewProps) {
  const {
    validCount = 0,
    invalidCount = 0,
    invalidUrls = [],
    duplicateCount = 0,
    uniqueUrls = [],
    providerCounts = {}
  } = detection;
  const credits = estimatedCredits ?? validCount;

  return (
    <div className="border-t border-app-border/50 overflow-hidden">
      <div className="p-4 flex flex-col gap-3">
        <div className="text-xs font-medium text-app-muted uppercase tracking-wider">
          {validCount} link{validCount !== 1 ? 's' : ''} detected
          {invalidCount > 0 && ` · ${invalidCount} invalid`}
          {duplicateCount > 0 && ` · ${duplicateCount} duplicate${duplicateCount !== 1 ? 's' : ''} removed`}
        </div>
        <ProviderGroupSummary providerCounts={providerCounts} />
        {invalidUrls.length > 0 && (
          <InvalidLinksPanel invalidUrls={invalidUrls} onClearInvalid={onClearInvalid} />
        )}
        <div className="text-xs text-app-muted">~{credits} credit{credits !== 1 ? 's' : ''}</div>
        {uniqueUrls.length > 0 && (
          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
            {uniqueUrls.slice(0, 8).map((url, i) => {
              try {
                const host = new URL(url).hostname;
                return (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-app-muted truncate max-w-[140px]"
                    title={url}
                  >
                    {host}
                  </span>
                );
              } catch {
                return null;
              }
            })}
            {uniqueUrls.length > 8 && (
              <span className="text-[10px] text-app-muted">+{uniqueUrls.length - 8} more</span>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <button
            type="button"
            onClick={onDownloadAll}
            className="flex-1 min-w-[120px] bg-app-primary hover:bg-app-primary-hover text-white text-sm font-medium py-2 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Download all
          </button>
          <button
            type="button"
            onClick={onCreateBatch}
            className="flex-1 min-w-[120px] bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <List className="w-4 h-4" /> Create batch
          </button>
          {onPreviewItems && (
            <button
              type="button"
              onClick={onPreviewItems}
              className="px-3 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg flex items-center gap-2 text-sm"
            >
              <Eye className="w-4 h-4" /> Preview
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
