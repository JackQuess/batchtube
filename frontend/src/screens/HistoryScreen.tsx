import React, { useEffect, useMemo, useState } from 'react';
import { ViewState } from '../types';
import { Badge } from '../components/Badge';
import { batchAPI } from '../services/batchAPI';
import { listTrackedJobs } from '../lib/trackedJobs';

interface HistoryScreenProps {
  onNavigate: (view: ViewState) => void;
}

interface HistoryRow {
  id: string;
  name: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  items: number;
  date: string;
}

const mapState = (state: 'waiting' | 'active' | 'completed' | 'failed'): HistoryRow['status'] => {
  if (state === 'active') return 'processing';
  if (state === 'completed') return 'completed';
  if (state === 'failed') return 'failed';
  return 'queued';
};

export const HistoryScreen: React.FC<HistoryScreenProps> = () => {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const loadHistory = async () => {
    const tracked = listTrackedJobs();

    const mapped = await Promise.all(
      tracked.map(async (job) => {
        try {
          const status = await batchAPI.getStatus(job.jobId);
          return {
            id: job.jobId,
            name: job.name,
            status: mapState(status.state),
            items: job.itemsCount,
            date: new Date(job.createdAt).toLocaleString()
          } as HistoryRow;
        } catch {
          return {
            id: job.jobId,
            name: job.name,
            status: 'queued',
            items: job.itemsCount,
            date: new Date(job.createdAt).toLocaleString()
          } as HistoryRow;
        }
      })
    );

    setRows(mapped);
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((row) => row.name.toLowerCase().includes(normalized) || row.id.toLowerCase().includes(normalized));
  }, [rows, query]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Batch History</h1>
          <p className="text-gray-400 text-sm">View logs of all processed batches.</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search batches..."
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary w-64"
          />
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden border border-white/5">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-white/5 text-gray-200 uppercase text-xs font-medium border-b border-white/5">
            <tr>
              <th className="px-6 py-4">Batch Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Items</th>
              <th className="px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td className="px-6 py-8 text-sm text-gray-500" colSpan={4}>
                  History yükleniyor...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-6 py-8 text-sm text-gray-500" colSpan={4}>
                  Sonuç bulunamadı.
                </td>
              </tr>
            ) : (
              filtered.map((job) => (
                <tr key={job.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{job.name}</div>
                    <div className="text-xs text-gray-600 font-mono mt-0.5">ID: {job.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={job.status} />
                  </td>
                  <td className="px-6 py-4 text-white">{job.items}</td>
                  <td className="px-6 py-4">{job.date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
