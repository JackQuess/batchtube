import React, { useState, useEffect } from 'react';
import { ViewState, BatchJob } from '../types';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

interface DashboardScreenProps {
  onNavigate: (view: ViewState) => void;
}

const mockJobs: BatchJob[] = [
  { id: '1023', name: 'Mixed_Social_Batch_01', status: 'processing', progress: 45, files: 12, date: 'Just now', providers: ['youtube', 'tiktok'] },
  { id: '1022', name: 'Instagram_Reels_Archive', status: 'completed', progress: 100, files: 85, date: '2 hrs ago', providers: ['instagram'] },
  { id: '1021', name: 'Podcast_Audio_Only', status: 'queued', progress: 0, files: 4, date: '5 hrs ago', providers: ['youtube', 'soundcloud'] },
];

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const [links, setLinks] = useState('');
  const [detected, setDetected] = useState<{name: string, count: number}[]>([]);

  // Simulation of auto-detection
  useEffect(() => {
    const lines = links.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) {
      setDetected([]);
      return;
    }

    const stats = {
      YouTube: lines.filter(l => l.includes('youtu')).length,
      TikTok: lines.filter(l => l.includes('tiktok')).length,
      Instagram: lines.filter(l => l.includes('instagram')).length,
      Twitter: lines.filter(l => l.includes('twitter') || l.includes('x.com')).length,
      Other: 0
    };
    stats.Other = lines.length - (stats.YouTube + stats.TikTok + stats.Instagram + stats.Twitter);
    
    const result = Object.entries(stats)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({ name, count }));
    
    setDetected(result);
  }, [links]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Create Batch Control Center */}
      <div className="glass-card p-1 rounded-xl border border-white/10 shadow-2xl shadow-black/50">
         <div className="bg-gradient-to-r from-white/5 to-transparent p-4 border-b border-white/5 flex justify-between items-center rounded-t-lg">
            <h2 className="font-bold text-white flex items-center gap-2">
               <span className="material-symbols-outlined text-primary">add_circle</span>
               Create New Batch
            </h2>
            <button 
                onClick={() => alert("File import dialog would open here (Supports CSV, TXT)")}
                className="text-xs text-primary font-bold hover:underline"
            >
                Import from file (CSV/TXT)
            </button>
         </div>
         
         <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Area */}
            <div className="lg:col-span-2 flex flex-col gap-4">
               <div className="relative flex-1">
                  <textarea 
                     className="w-full h-40 bg-black/20 border border-white/10 rounded-lg p-4 text-sm font-mono text-gray-300 focus:outline-none focus:border-primary/50 placeholder-gray-600 resize-none transition-all"
                     placeholder="Paste links from YouTube, TikTok, Instagram, X, SoundCloud...&#10;One link per line."
                     value={links}
                     onChange={(e) => setLinks(e.target.value)}
                  ></textarea>
                  <div className="absolute bottom-4 right-4 flex gap-2">
                     {detected.map(d => (
                        <span key={d.name} className="px-2 py-1 rounded bg-white/10 text-xs font-bold text-white border border-white/10 backdrop-blur-sm">
                           {d.name}: {d.count}
                        </span>
                     ))}
                  </div>
               </div>
            </div>

            {/* Options Panel */}
            <div className="flex flex-col gap-4">
               <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Output Format</label>
                  <div className="grid grid-cols-3 gap-2">
                     {['MP4', 'MP3', 'Best'].map(fmt => (
                        <button key={fmt} className={`py-2 rounded border text-xs font-bold transition-all ${fmt === 'MP4' ? 'bg-primary text-white border-primary' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}`}>
                           {fmt}
                        </button>
                     ))}
                  </div>
               </div>

               <div>
                  <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Quality</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none">
                     <option>Best Available (Max)</option>
                     <option>4K (2160p)</option>
                     <option>1080p</option>
                  </select>
               </div>

               <label className="flex items-center gap-3 p-3 rounded bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-center w-5 h-5 rounded bg-primary/20 text-primary">
                     <span className="material-symbols-outlined text-[16px]">check</span>
                  </div>
                  <span className="text-sm font-medium text-gray-300">Auto-Zip Batch</span>
               </label>

               <Button fullWidth icon="rocket_launch" onClick={() => onNavigate('queue')} disabled={!links}>
                  Start Batch
               </Button>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. Active Batches */}
        <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-bold text-white">Active Batches</h3>
            <div className="glass-card rounded-xl overflow-hidden border border-white/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-white/5 text-gray-200 uppercase text-xs font-medium">
                    <tr>
                      <th className="px-6 py-4">Batch Name</th>
                      <th className="px-6 py-4">Sources</th>
                      <th className="px-6 py-4">Progress</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {mockJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 font-medium text-white">
                          <div className="flex flex-col">
                            <span>{job.name}</span>
                            <span className="text-xs text-gray-600">{job.files} items</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex -space-x-2">
                              {job.providers.map((p, i) => (
                                 <div key={i} className="w-6 h-6 rounded-full bg-white/10 border border-black flex items-center justify-center text-[10px] uppercase text-gray-300 font-bold" title={p}>
                                    {p[0]}
                                 </div>
                              ))}
                           </div>
                        </td>
                        <td className="px-6 py-4 w-32">
                          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${job.progress}%` }}></div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge status={job.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                             className="text-gray-500 hover:text-white transition-colors" 
                             title="Cancel"
                             onClick={() => alert("Cancelling batch " + job.id)}
                          >
                            <span className="material-symbols-outlined text-[18px]">cancel</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        </div>

        {/* 3. Right Column: Stats & Health */}
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-white">System Status</h3>
            
            <div className="glass-card p-6 rounded-xl border border-white/5">
               <h4 className="text-gray-400 text-xs font-bold uppercase mb-4">Queue Health</h4>
               <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                     <p className="text-2xl font-bold text-white">4</p>
                     <p className="text-xs text-gray-500">Workers Online</p>
                  </div>
                  <div>
                     <p className="text-2xl font-bold text-emerald-400">1.2 <span className="text-sm text-gray-500">GB/s</span></p>
                     <p className="text-xs text-gray-500">Avg Speed</p>
                  </div>
               </div>
               <div className="h-px bg-white/10 mb-4"></div>
               <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Est. Wait Time</span>
                  <span className="text-white font-medium">~12s</span>
               </div>
            </div>

            <div className="glass-card p-6 rounded-xl border border-white/5 bg-gradient-to-br from-primary/5 to-transparent">
               <h4 className="text-gray-400 text-xs font-bold uppercase mb-4">Your Plan</h4>
               <div className="flex justify-between items-end mb-2">
                  <span className="text-xl font-bold text-white">Pro Plan</span>
                  <span className="text-xs text-primary font-bold">124 / 500 GB</span>
               </div>
               <div className="h-1.5 bg-black/40 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-primary w-[25%] rounded-full"></div>
               </div>
               <Button variant="secondary" fullWidth className="h-8 text-xs border-primary/20 hover:border-primary/50" onClick={() => onNavigate('billing')}>Manage Subscription</Button>
            </div>
        </div>

      </div>
    </div>
  );
};