import React from 'react';
import { Download, List, CheckSquare, X } from 'lucide-react';
import type { DetectionResult } from '../../lib/sourceDetection';
import { SourcePreviewCard } from './SourcePreviewCard';

export interface CommandInterpretationPreviewProps {
  detection: DetectionResult & { type: 'command' };
  onSuggestion: (action: string, payload?: string) => void;
  onCancel: () => void;
}

export function CommandInterpretationPreview({
  detection,
  onSuggestion,
  onCancel
}: CommandInterpretationPreviewProps) {
  const { commandRaw, suggestions = [], latestN, commandSourceUrl } = detection;
  const hasSource = Boolean(commandSourceUrl);

  return (
    <div className="border-t border-app-border/50 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[10px] font-semibold text-app-muted uppercase tracking-widest">
            Command
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded hover:bg-white/10 text-app-muted hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-white/80 font-mono truncate mb-3" title={commandRaw}>
          {commandRaw}
        </p>
        {latestN != null && hasSource && (
          <p className="text-xs text-app-muted mb-3">
            Download latest {latestN} from source
          </p>
        )}
        <div className="flex flex-col gap-1">
          {suggestions.slice(0, 3).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSuggestion(s.action, s.payload)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
            >
              {s.action === 'latest' ? (
                <Download className="w-4 h-4 text-app-primary" />
              ) : s.action === 'history' ? (
                <List className="w-4 h-4 text-app-muted group-hover:text-white" />
              ) : s.action === 'files' ? (
                <CheckSquare className="w-4 h-4 text-app-muted group-hover:text-white" />
              ) : (
                <Download className="w-4 h-4 text-app-muted group-hover:text-app-primary" />
              )}
              <span className="text-sm font-medium text-app-muted group-hover:text-white flex-1">
                {s.label}
              </span>
              <span className="text-xs text-app-muted/70">{s.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
