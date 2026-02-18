import React from 'react';
import { ViewState, BatchJob } from '../types';
import { Badge } from '../components/Badge';

interface HistoryScreenProps {
  onNavigate: (view: ViewState) => void;
}

const historyData: BatchJob[] = [
  { id: '1025', name: 'Travel_Vlog_Assets_Bali', status: 'completed', progress: 100, files: 45, date: 'Oct 24, 2026 14:30', providers: ['youtube'], totalSize: '4.2 GB' },
  { id: '1024', name: 'Funny_Cats_Compilation', status: 'completed', progress: 100, files: 12, date: 'Oct 23, 2026 09:15', providers: ['tiktok'], totalSize: '156 MB' },
  { id: '1023', name: 'Client_Ref_Material_Sport', status: 'failed', progress: 45, files: 8, date: 'Oct 22, 2026 18:20', providers: ['mixed'], totalSize: '0 B' },
  { id: '1022', name: 'Podcast_Ep_404_Raw', status: 'completed', progress: 100, files: 1, date: 'Oct 21, 2026 11:00', providers: ['youtube'], totalSize: '850 MB' }
];

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">History</h1>
          <p className="text-sm text-gray-400 mt-1">Review completed and failed batches.</p>
        </div>
        <button onClick={() => onNavigate('files')} className="text-sm text-primary hover:text-red-400">Go to files</button>
      </div>

      <section className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10 bg-white/5">
          <h2 className="text-white font-semibold">Batch log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Batch</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Items</th>
                <th className="px-5 py-3">Total size</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">ZIP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {historyData.map((job) => (
                <tr key={job.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-white font-medium">{job.name}</p>
                    <p className="text-xs text-gray-600 font-mono">ID: {job.id}</p>
                  </td>
                  <td className="px-5 py-4"><Badge status={job.status} /></td>
                  <td className="px-5 py-4 text-gray-300">{job.files}</td>
                  <td className="px-5 py-4 text-gray-300">{job.totalSize}</td>
                  <td className="px-5 py-4 text-gray-400">{job.date}</td>
                  <td className="px-5 py-4 text-right">
                    <button className="text-primary hover:text-red-400 text-sm font-semibold">Download</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
