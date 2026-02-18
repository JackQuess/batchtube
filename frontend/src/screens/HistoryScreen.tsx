import React from 'react';
import { ViewState, BatchJob } from '../types';
import { Badge } from '../components/Badge';

interface HistoryScreenProps {
  onNavigate: (view: ViewState) => void;
}

const historyData: BatchJob[] = [
  { id: '1025', name: 'Travel_Vlog_Assets_Bali', status: 'completed', progress: 100, files: 45, date: '2023-10-24 14:30', providers: ['youtube'], totalSize: '4.2 GB' },
  { id: '1024', name: 'Funny_Cats_Compilation', status: 'completed', progress: 100, files: 12, date: '2023-10-23 09:15', providers: ['tiktok'], totalSize: '156 MB' },
  { id: '1023', name: 'Client_Ref_Material_Sport', status: 'failed', progress: 45, files: 8, date: '2023-10-22 18:20', providers: ['mixed'], totalSize: '0 B' },
  { id: '1022', name: 'Podcast_Ep_404_Raw', status: 'completed', progress: 100, files: 1, date: '2023-10-21 11:00', providers: ['youtube'], totalSize: '850 MB' },
  { id: '1021', name: 'Insta_Stories_Backup_Oct', status: 'completed', progress: 100, files: 124, date: '2023-10-20 08:45', providers: ['instagram'], totalSize: '1.1 GB' },
];

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onNavigate }) => {
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
                <th className="px-6 py-4">Provider Mix</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Total Size</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {historyData.map((job) => (
                <tr key={job.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{job.name}</div>
                    <div className="text-xs text-gray-600 font-mono mt-0.5">ID: {job.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={job.status} />
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex gap-1">
                        {job.providers.map(p => (
                           <span key={p} className="px-2 py-0.5 bg-white/5 rounded text-[10px] uppercase border border-white/10">{p}</span>
                        ))}
                     </div>
                  </td>
                  <td className="px-6 py-4 text-white">{job.files}</td>
                  <td className="px-6 py-4 text-white font-mono">{job.totalSize}</td>
                  <td className="px-6 py-4">{job.date}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary hover:text-white transition-colors mr-3 text-xs font-bold uppercase flex items-center gap-1 float-right">
                        <span className="material-symbols-outlined text-[16px]">download</span> ZIP
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};