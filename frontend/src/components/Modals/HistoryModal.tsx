import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, ChevronRight, Clock } from 'lucide-react';
import { batchesAPI, type BatchListItem } from '../../services/batchesAPI';

interface HistoryModalProps {
  onClose: () => void;
  onSelectBatch?: (batchId: string) => void;
}

function statusToDisplay(s: BatchListItem['status']): 'completed' | 'processing' | 'failed' {
  if (s === 'completed') return 'completed';
  if (s === 'failed' || s === 'cancelled') return 'failed';
  return 'processing';
}

export function HistoryModal({ onClose, onSelectBatch }: HistoryModalProps) {
  const [list, setList] = useState<BatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    batchesAPI
      .list({ limit: 50 })
      .then((res) => {
        if (mounted) setList(res.data);
      })
      .catch(() => {
        if (mounted) setError('Could not load history.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-app-primary animate-spin" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-app-border" />;
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      <div className="p-6 flex flex-col gap-2 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-app-primary animate-spin" />
          </div>
        )}
        {error && (
          <p className="text-sm text-red-400 py-4">{error}</p>
        )}
        {!loading && !error && list.length === 0 && (
          <p className="text-sm text-app-muted py-4">No batches yet.</p>
        )}
        {!loading && !error && list.map((batch) => (
          <button
            type="button"
            key={batch.id}
            onClick={() => onSelectBatch?.(batch.id)}
            className="w-full text-left flex items-center justify-between p-4 rounded-xl border border-app-border bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-black/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <StatusIcon status={statusToDisplay(batch.status)} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white group-hover:text-app-primary transition-colors">
                  {batch.name ?? `Batch ${batch.id.slice(0, 8)}`}
                </span>
                <div className="flex items-center gap-2 text-xs text-app-muted">
                  <span>{batch.item_count} items</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDate(batch.created_at)}
                  </span>
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-app-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>

      <div className="mt-auto border-t border-app-border bg-black/40 p-4 flex items-center justify-between">
        <span className="text-sm text-app-muted">{list.length} batches</span>
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}
