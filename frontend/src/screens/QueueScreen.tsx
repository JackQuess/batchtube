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
  { id: '5', title: 'SoundCloud Mix 2026', provider: 'soundcloud', status: 'failed', progress: 10, speed: '0 KB/s', size: '-' },
];

export const QueueScreen: React.FC<QueueScreenProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
       <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Active Queue</h1>
          <div className="flex gap-2">
             <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/10">Clear Completed</button>
             <Button icon="add" className="h-10 px-4" onClick={() => onNavigate('new-batch')}>New Batch</Button>
          </div>
       </div>

       {/* Filters */}
       <div className="flex gap-2 overflow-x-auto pb-2">
          {['All', 'Downloading', 'Processing', 'Failed'].map(f => (
             <button key={f} className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-gray-300 hover:bg-white/10 whitespace-nowrap">
                {f}
             </button>
          ))}
       </div>

       <div className="glass-card rounded-xl overflow-hidden border border-white/5">
          <table className="w-full text-left text-sm text-gray-400">
             <thead className="bg-white/5 text-gray-200 uppercase text-xs font-medium border-b border-white/5">
                <tr>
                   <th className="px-6 py-4">Item</th>
                   <th className="px-6 py-4">Provider</th>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4">Size/Speed</th>
                   <th className="px-6 py-4 text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-white/5">
                {queueItems.map((item) => (
                   <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                         <div className="font-medium text-white truncate max-w-xs" title={item.title}>{item.title}</div>
                         {item.status === 'downloading' && (
                            <div className="w-24 h-1 bg-gray-700 rounded-full mt-2 overflow-hidden">
                               <div className="h-full bg-primary" style={{ width: `${item.progress}%` }}></div>
                            </div>
                         )}
                      </td>
                      <td className="px-6 py-4 capitalize">
                         <span className="flex items-center gap-2 text-gray-300">
                            <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                            {item.provider}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                         <Badge status={item.status} />
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                         <div className="text-white">{item.size}</div>
                         <div className="text-gray-500">{item.speed}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         {item.status === 'failed' ? (
                            <button className="text-primary hover:text-white transition-colors text-xs font-bold uppercase">Retry</button>
                         ) : (
                            <button className="text-gray-500 hover:text-white transition-colors">
                               <span className="material-symbols-outlined text-[18px]">cancel</span>
                            </button>
                         )}
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
};