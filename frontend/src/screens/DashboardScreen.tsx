import React, { useMemo, useState } from 'react';
import { ViewState, BatchJob } from '../types';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

interface DashboardScreenProps {
  onNavigate: (view: ViewState) => void;
}

const mockJobs: BatchJob[] = [
  { id: '1023', name: 'Social_Mix_Q1', status: 'processing', progress: 45, files: 12, date: 'Just now', providers: ['youtube', 'tiktok'] },
  { id: '1022', name: 'Instagram_Reels_Archive', status: 'completed', progress: 100, files: 85, date: '2h ago', providers: ['instagram'] },
  { id: '1021', name: 'Podcast_Audio_Only', status: 'queued', progress: 0, files: 4, date: '5h ago', providers: ['youtube', 'soundcloud'] }
];

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const [links, setLinks] = useState('');

  const parsedCount = useMemo(() => links.split('\n').filter((line) => line.trim()).length, [links]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-7 animate-in fade-in duration-500">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-5 border border-white/10">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Active Batches</p>
          <p className="text-3xl font-bold text-white mt-2">{mockJobs.filter((job) => job.status !== 'completed').length}</p>
        </div>
        <div className="glass-card rounded-xl p-5 border border-white/10">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Completed Today</p>
          <p className="text-3xl font-bold text-white mt-2">18</p>
        </div>
        <div className="glass-card rounded-xl p-5 border border-primary/30 bg-primary/10">
          <p className="text-xs text-primary uppercase tracking-wide">Plan</p>
          <p className="text-3xl font-bold text-white mt-2">Pro</p>
        </div>
      </section>

      <section className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 border-b border-white/10 bg-white/5">
          <div>
            <h2 className="text-white font-semibold">Create new batch</h2>
            <p className="text-sm text-gray-500 mt-1">Paste links, configure output, and push to queue.</p>
          </div>
          <Button variant="secondary" onClick={() => onNavigate('new-batch')} icon="open_in_new" className="h-10 px-4">
            Advanced Editor
          </Button>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8">
            <textarea
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              placeholder="https://youtube.com/...\nhttps://tiktok.com/...\nhttps://instagram.com/..."
              className="w-full h-44 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50"
            />
            <p className="text-xs text-gray-500 mt-2">{parsedCount} URL detected</p>
          </div>

          <div className="lg:col-span-4 space-y-3">
            <select className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50">
              <option>Format: MP4</option>
              <option>Format: MP3</option>
              <option>Format: MKV</option>
            </select>
            <select className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50">
              <option>Quality: Best</option>
              <option>1080p</option>
              <option>720p</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" defaultChecked className="accent-primary" />
              Archive as ZIP
            </label>
            <Button fullWidth icon="rocket_launch" disabled={parsedCount === 0} onClick={() => onNavigate('queue')}>
              Start Batch
            </Button>
          </div>
        </div>
      </section>

      <section className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <h3 className="text-white font-semibold">Recent batches</h3>
          <button onClick={() => onNavigate('history')} className="text-sm text-primary hover:text-red-400 transition-colors">View all</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Progress</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mockJobs.map((job) => (
                <tr key={job.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4 text-white font-medium">{job.name}</td>
                  <td className="px-5 py-4">
                    <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${job.progress}%` }} />
                    </div>
                  </td>
                  <td className="px-5 py-4"><Badge status={job.status} /></td>
                  <td className="px-5 py-4 text-gray-400">{job.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
