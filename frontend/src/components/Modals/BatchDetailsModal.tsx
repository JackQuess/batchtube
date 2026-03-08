import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Download } from 'lucide-react';
import { batchAPI, type BatchJobStatus } from '../../services/batchAPI';

interface BatchDetailsModalProps {
  batchId: string;
  onClose: () => void;
}

export function BatchDetailsModal({ batchId, onClose }: BatchDetailsModalProps) {
  const [status, setStatus] = useState<BatchJobStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [zipLoading, setZipLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    batchAPI
      .getStatus(batchId)
      .then((s) => {
        if (mounted) setStatus(s);
      })
      .catch(() => {
        if (mounted) setStatus(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [batchId]);

  const handleDownloadZip = async () => {
    setZipLoading(true);
    const popup = window.open(undefined, '_blank', 'noopener,noreferrer');
    try {
      const url = await batchAPI.getSignedDownloadUrl(batchId);
      if (popup) {
        popup.location.href = url;
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.rel = 'noopener noreferrer';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      if (popup) popup.close();
      const message = err instanceof Error ? err.message : 'ZIP alınamadı.';
      console.error('Download ZIP failed:', err);
      alert(message);
    } finally {
      setZipLoading(false);
    }
  };

  if (loading || !status) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 text-app-primary animate-spin" />
      </div>
    );
  }

  const result = status.result;
  const items = result?.items ?? [];
  const isDone = status.state === 'completed' || status.state === 'failed';

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      <div className="p-6 overflow-y-auto">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-xs text-app-muted uppercase tracking-wider">Status</p>
            <p className="text-sm font-medium text-white capitalize">{status.state}</p>
          </div>
          {result && (
            <div className="flex gap-4 text-xs">
              <span className="text-emerald-500">{result.succeeded} succeeded</span>
              {result.failed > 0 && <span className="text-red-400">{result.failed} failed</span>}
            </div>
          )}
          {isDone && status.state === 'completed' && (
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={zipLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-app-primary hover:bg-app-primary-hover text-white text-sm font-medium disabled:opacity-50"
            >
              {zipLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download ZIP
            </button>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs text-app-muted uppercase tracking-wider mb-2">Items</p>
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-xl border border-app-border bg-white/5"
            >
              <div className="flex items-center gap-3 min-w-0">
                {item.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                )}
                <span className="text-sm text-white truncate" title={item.title}>
                  {item.title}
                </span>
                <span className="text-[10px] text-app-muted shrink-0">{item.provider}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto border-t border-app-border bg-black/40 p-4 flex justify-end">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}
