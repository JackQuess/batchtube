import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle2, XCircle, X, Download } from 'lucide-react';
import { batchAPI, type BatchJobStatus } from '../services/batchAPI';
import { listTrackedJobs } from '../lib/trackedJobs';

interface FloatingProcessingPanelProps {
  batchIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveBatchId: (id: string) => void;
}

const POLL_INTERVAL_MS = 2000;

export function FloatingProcessingPanel({ batchIds, isOpen, onClose, onRemoveBatchId }: FloatingProcessingPanelProps) {
  const [statuses, setStatuses] = useState<Record<string, BatchJobStatus>>({});

  const fetchStatus = useCallback(async (id: string) => {
    try {
      const status = await batchAPI.getStatus(id);
      setStatuses((prev) => ({ ...prev, [id]: status }));
      return status;
    } catch {
      setStatuses((prev) => ({ ...prev, [id]: { state: 'failed', progress: 0 } }));
      return null;
    }
  }, []);

  useEffect(() => {
    if (batchIds.length === 0) return;
    const interval = setInterval(async () => {
      for (const id of batchIds) {
        await fetchStatus(id);
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [batchIds, fetchStatus]);

  useEffect(() => {
    batchIds.forEach((id) => {
      if (!statuses[id]) void fetchStatus(id);
    });
  }, [batchIds]);

  const tracked = listTrackedJobs();
  const getBatchName = (jobId: string) => tracked.find((j) => j.jobId === jobId)?.name ?? `Batch ${jobId.slice(0, 8)}`;

  const handleDownloadZip = async (jobId: string) => {
    try {
      const url = await batchAPI.getSignedDownloadUrl(jobId);
      window.open(url, '_blank');
    } catch {
      // ignore
    }
  };

  const handleCancel = async (jobId: string) => {
    try {
      await batchAPI.cancel(jobId);
      await fetchStatus(jobId);
    } catch {
      // ignore
    }
  };

  if (!isOpen || batchIds.length === 0) return null;

  const hasActive = batchIds.some((id) => {
    const s = statuses[id];
    return !s || s.state === 'waiting' || s.state === 'active';
  });
  const allDone = !hasActive;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-6 right-6 w-80 max-h-[70vh] flex flex-col glass-panel rounded-2xl shadow-2xl z-50 overflow-hidden"
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20 shrink-0">
          <div className="flex items-center gap-2">
            {allDone ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-app-primary animate-spin shrink-0" />
            )}
            <span className="text-sm font-medium text-white">
              {allDone
                ? batchIds.length === 1
                  ? 'Done'
                  : `Done · ${batchIds.length} batches`
                : batchIds.length === 1
                  ? 'Processing'
                  : `${batchIds.length} batches`}
            </span>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-4 h-4 text-app-muted hover:text-white" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4 bg-black/40 overflow-y-auto min-h-0">
          {batchIds.map((id) => {
            const status = statuses[id];
            const name = getBatchName(id);
            const state = status?.state ?? 'waiting';
            const progress = status?.progress ?? 0;
            const isDone = state === 'completed' || state === 'failed';
            const result = status?.result;

            return (
              <div key={id} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-white truncate">{name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {isDone && state === 'completed' && (
                      <button
                        type="button"
                        onClick={() => handleDownloadZip(id)}
                        className="p-1.5 rounded-lg bg-app-primary/20 hover:bg-app-primary/30 text-app-primary transition-colors"
                        title="Download ZIP"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!isDone && (
                      <button
                        type="button"
                        onClick={() => handleCancel(id)}
                        className="text-[10px] font-medium text-app-muted hover:text-red-400 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemoveBatchId(id)}
                      className="p-1 hover:bg-white/10 rounded-lg transition-colors text-app-muted hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  {state === 'waiting' && <span className="text-app-muted">Queued...</span>}
                  {state === 'active' && (
                    <span className="text-app-muted">{status?.stage ?? 'Processing...'}</span>
                  )}
                  {state === 'completed' && (
                    <span className="text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Done
                      {result != null && ` · ${result.succeeded}/${result.total}`}
                    </span>
                  )}
                  {state === 'failed' && (
                    <span className="text-red-400 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Failed
                      {result != null && result.failed > 0 && ` · ${result.failed} failed`}
                    </span>
                  )}
                  {!isDone && <span className="text-app-primary font-medium">{Math.round(progress)}%</span>}
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    className={`h-full rounded-full ${state === 'failed' ? 'bg-red-500' : state === 'completed' ? 'bg-emerald-500' : 'bg-app-primary shadow-[0_0_10px_rgba(225,29,72,0.5)]'}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
