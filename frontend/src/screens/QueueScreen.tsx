import React from 'react';
import { ViewState, QueueItem } from '../types';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

interface QueueScreenProps {
  onNavigate: (view: ViewState) => void;
}

const queueItems: QueueItem[] = [
  { id: '1', title: 'Amazing Nature 4K - Wildlife', provider: 'youtube', status: 'downloading', progress: 45, speed: '12 MB/s', size: '1.2 GB' },
  { id: '2', title: 'TikTok Dance Challenge Compilation', provider: 'tiktok', status: 'processing', progress: 80, speed: '-', size: '145 MB' },
  { id: '3', title: 'Instagram Reel: Sunset Beach', provider: 'instagram', status: 'completed', progress: 100, speed: '-', size: '12 MB' },
  { id: '4', title: 'Tech Review - iPhone 16', provider: 'youtube', status: 'queued', progress: 0, speed: '-', size: '-' },
  { id: '5', title: 'SoundCloud Mix 2026', provider: 'soundcloud', status: 'failed', progress: 10, speed: '0 KB/s', size: '-' }
];

export const QueueScreen: React.FC<QueueScreenProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Queue</h1>
          <p className="text-sm text-gray-400 mt-1">Monitor active jobs and handle failed items.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="h-10 px-4">Clear Completed</Button>
          <Button icon="add" className="h-10 px-4" onClick={() => onNavigate('new-batch')}>New Batch</Button>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10 bg-white/5">
          <h2 className="text-white font-semibold">Active items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Item</th>
                <th className="px-5 py-3">Provider</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Size/Speed</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {queueItems.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-white font-medium truncate max-w-xs">{item.title}</p>
                    {(item.status === 'downloading' || item.status === 'processing') && (
                      <div className="mt-2 w-28 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${item.progress}%` }} />
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 capitalize text-gray-300">{item.provider}</td>
                  <td className="px-5 py-4"><Badge status={item.status} /></td>
                  <td className="px-5 py-4 text-xs font-mono">
                    <div className="text-white">{item.size}</div>
                    <div className="text-gray-500">{item.speed}</div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {item.status === 'failed' ? (
                      <button className="text-primary hover:text-red-400 text-xs font-semibold">Retry</button>
                    ) : (
                      <button className="text-gray-500 hover:text-white"><span className="material-symbols-outlined text-[18px]">cancel</span></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
