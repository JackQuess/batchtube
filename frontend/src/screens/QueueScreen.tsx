import React, { useEffect, useMemo, useState } from 'react';
import { ViewState } from '../types';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { batchAPI } from '../services/batchAPI';
import { listTrackedJobs, removeTrackedJob } from '../lib/trackedJobs';

interface QueueScreenProps {
  onNavigate: (view: ViewState) => void;
}

interface QueueRow {
  id: string;
  title: string;
  provider: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  size: string;
}

const mapStatus = (state: 'waiting' | 'active' | 'completed' | 'failed'): QueueRow['status'] => {
  if (state === 'active') return 'processing';
  if (state === 'completed') return 'completed';
  if (state === 'failed') return 'failed';
  return 'queued';
};

export const QueueScreen: React.FC<QueueScreenProps> = ({ onNavigate }) => {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQueue = async () => {
    const tracked = listTrackedJobs();

    if (tracked.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const allRows: QueueRow[] = [];

    for (const job of tracked) {
      try {
        const status = await batchAPI.getStatus(job.jobId);
        const mappedStatus = mapStatus(status.state);

        if (status.result?.results?.length) {
          status.result.results.forEach((result, index) => {
            const resultStatus: QueueRow['status'] =
              result.status === 'success'
                ? 'completed'
                : mappedStatus === 'failed'
                  ? 'failed'
                  : mappedStatus;

            allRows.push({
              id: `${job.jobId}-${index}`,
              title: result.meta?.title || result.fileName || `${job.name} / Item ${index + 1}`,
              provider: (result.provider || 'generic').toUpperCase(),
              status: resultStatus,
              progress: resultStatus === 'completed' ? 100 : Math.round(status.progress || 0),
              size: result.bytes ? `${(result.bytes / (1024 * 1024)).toFixed(1)} MB` : '-'
            });
          });
        } else {
          allRows.push({
            id: job.jobId,
            title: job.name,
            provider: 'BATCH',
            status: mappedStatus,
            progress: Math.round(status.progress || 0),
            size: `${job.itemsCount} item`
          });
        }
      } catch {
        allRows.push({
          id: job.jobId,
          title: job.name,
          provider: 'BATCH',
          status: 'queued',
          progress: 0,
          size: `${job.itemsCount} item`
        });
      }
    }

    setRows(allRows);
    setLoading(false);
  };

  useEffect(() => {
    let interval: number | null = null;
    loadQueue();
    interval = window.setInterval(loadQueue, 3000);
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, []);

  const activeRows = useMemo(() => rows.filter((row) => row.status === 'queued' || row.status === 'processing'), [rows]);

  const clearCompleted = () => {
    const tracked = listTrackedJobs();
    tracked.forEach((job) => {
      const hasActive = rows.some((row) => row.id.startsWith(job.jobId) && (row.status === 'queued' || row.status === 'processing'));
      if (!hasActive) {
        removeTrackedJob(job.jobId);
      }
    });
    loadQueue();
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Active Queue</h1>
        <div className="flex gap-2">
          <button onClick={clearCompleted} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/10">
            Clear Completed
          </button>
          <Button icon="add" className="h-10 px-4" onClick={() => onNavigate('new-batch')}>
            New Batch
          </Button>
        </div>
      </div>

      <p className="text-sm text-gray-500">{activeRows.length} aktif öğe işleniyor.</p>

      <div className="glass-card rounded-xl overflow-hidden border border-white/5">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-white/5 text-gray-200 uppercase text-xs font-medium border-b border-white/5">
            <tr>
              <th className="px-6 py-4">Item</th>
              <th className="px-6 py-4">Provider</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Size</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td className="px-6 py-8 text-sm text-gray-500" colSpan={4}>
                  Queue yükleniyor...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-6 py-8 text-sm text-gray-500" colSpan={4}>
                  Aktif queue yok.
                </td>
              </tr>
            ) : (
              rows.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white truncate max-w-xs" title={item.title}>
                      {item.title}
                    </div>
                    {(item.status === 'processing' || item.status === 'queued') && (
                      <div className="w-24 h-1 bg-gray-700 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${item.progress}%` }}></div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 capitalize">{item.provider}</td>
                  <td className="px-6 py-4">
                    <Badge status={item.status} />
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-white">{item.size}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
