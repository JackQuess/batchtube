import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface InvalidLinksPanelProps {
  invalidUrls: string[];
  onClearInvalid?: () => void;
  maxShow?: number;
}

export function InvalidLinksPanel({ invalidUrls, onClearInvalid, maxShow = 5 }: InvalidLinksPanelProps) {
  if (!invalidUrls.length) return null;
  const show = invalidUrls.slice(0, maxShow);
  const rest = invalidUrls.length - show.length;
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
      <div className="flex items-center gap-2 text-amber-400 text-xs font-medium mb-1.5">
        <AlertCircle className="w-3.5 h-3.5" />
        {invalidUrls.length} invalid link{invalidUrls.length !== 1 ? 's' : ''}
      </div>
      <ul className="text-[11px] text-app-muted truncate space-y-0.5">
        {show.map((url, i) => (
          <li key={i} className="truncate" title={url}>
            {url}
          </li>
        ))}
        {rest > 0 && <li className="text-amber-400/80">+{rest} more</li>}
      </ul>
      {onClearInvalid && (
        <button
          type="button"
          onClick={onClearInvalid}
          className="mt-2 text-[10px] font-medium text-amber-400 hover:text-amber-300"
        >
          Clear invalid
        </button>
      )}
    </div>
  );
}
