import React, { useEffect, useMemo, useState } from 'react';
import { ViewState } from '../types';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { batchAPI, BatchJobStatus } from '../services/batchAPI';
import { listTrackedJobs, saveTrackedJob } from '../lib/trackedJobs';

interface DashboardScreenProps {
  onNavigate: (view: ViewState) => void;
}

interface DashboardBatch {
  id: string;
  name: string;
  createdAt: string;
  files: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
}

const mapStatus = (state: BatchJobStatus['state']): DashboardBatch['status'] => {
  if (state === 'completed') return 'completed';
  if (state === 'failed') return 'failed';
  if (state === 'active') return 'processing';
  return 'queued';
};

const toRelativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day ago`;
};

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const [links, setLinks] = useState('');
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp4');
  const [quality, setQuality] = useState<'1080p' | '4k'>('1080p');
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<DashboardBatch[]>([]);

  const urls = useMemo(() => links.split('\n').map((line) => line.trim()).filter(Boolean), [links]);

  const loadJobs = async () => {
    const tracked = listTrackedJobs().slice(0, 10);
    if (tracked.length === 0) {
      setJobs([]);
      return;
    }

    const mapped = await Promise.all(
      tracked.map(async (trackedJob) => {
        try {
          const status = await batchAPI.getStatus(trackedJob.jobId);
          return {
            id: trackedJob.jobId,
            name: trackedJob.name,
            createdAt: trackedJob.createdAt,
            files: trackedJob.itemsCount,
            status: mapStatus(status.state),
            progress: Math.round(status.progress || 0)
          } as DashboardBatch;
        } catch {
          return {
            id: trackedJob.jobId,
            name: trackedJob.name,
            createdAt: trackedJob.createdAt,
            files: trackedJob.itemsCount,
            status: 'queued',
            progress: 0
          } as DashboardBatch;
        }
      })
    );

    setJobs(mapped);
  };

  useEffect(() => {
    let interval: number | null = null;
    loadJobs();
    interval = window.setInterval(loadJobs, 4000);
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, []);

  const handleStartBatch = async () => {
    if (urls.length === 0 || starting) return;
    setStarting(true);
    setStartError(null);

    try {
      const response = await batchAPI.createJob({
        items: urls.map((url, index) => ({ url, title: `Item ${index + 1}` })),
        format,
        quality
      });

      saveTrackedJob({
        jobId: response.jobId,
        name: `Batch_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}`,
        createdAt: new Date().toISOString(),
        itemsCount: urls.length,
        format,
        quality,
        urls
      });

      setLinks('');
      onNavigate('queue');
    } catch (err: any) {
      setStartError(err?.message || 'Batch başlatılamadı.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-card p-1 rounded-xl border border-white/10 shadow-2xl shadow-black/50">
        <div className="bg-gradient-to-r from-white/5 to-transparent p-4 border-b border-white/5 flex justify-between items-center rounded-t-lg">
          <h2 className="font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">add_circle</span>
            Create New Batch
          </h2>
          <button onClick={() => onNavigate('new-batch')} className="text-xs text-primary font-bold hover:underline">
            Advanced editor
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <textarea
              className="w-full h-40 bg-black/20 border border-white/10 rounded-lg p-4 text-sm font-mono text-gray-300 focus:outline-none focus:border-primary/50 placeholder-gray-600 resize-none transition-all"
              placeholder="Paste links from YouTube, TikTok, Instagram, X, SoundCloud...&#10;One link per line."
              value={links}
              onChange={(e) => setLinks(e.target.value)}
            ></textarea>
            <p className="text-xs text-gray-500">{urls.length} link detected</p>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Output Format</label>
              <div className="grid grid-cols-2 gap-2">
                {(['mp4', 'mp3'] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => setFormat(item)}
                    className={`py-2 rounded border text-xs font-bold transition-all ${format === item ? 'bg-primary text-white border-primary' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}`}
                  >
                    {item.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">Quality</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as '1080p' | '4k')}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="1080p">1080p</option>
                <option value="4k">4K</option>
              </select>
            </div>

            {startError && <p className="text-xs text-red-400">{startError}</p>}

            <Button fullWidth icon="rocket_launch" onClick={handleStartBatch} disabled={!urls.length || starting}>
              {starting ? 'Starting...' : 'Start Batch'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-white">Active Batches</h3>
          <div className="glass-card rounded-xl overflow-hidden border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-white/5 text-gray-200 uppercase text-xs font-medium">
                  <tr>
                    <th className="px-6 py-4">Batch Name</th>
                    <th className="px-6 py-4">Progress</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {jobs.length === 0 ? (
                    <tr>
                      <td className="px-6 py-8 text-sm text-gray-500" colSpan={4}>
                        Henüz batch yok. Link ekleyip başlat.
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 font-medium text-white">
                          <div className="flex flex-col">
                            <span>{job.name}</span>
                            <span className="text-xs text-gray-600">{job.files} items</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 w-40">
                          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${job.progress}%` }}></div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge status={job.status} />
                        </td>
                        <td className="px-6 py-4 text-xs">{toRelativeTime(job.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white">System Status</h3>

          <div className="glass-card p-6 rounded-xl border border-white/5">
            <h4 className="text-gray-400 text-xs font-bold uppercase mb-4">Queue Health</h4>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-2xl font-bold text-white">{jobs.filter((job) => job.status === 'processing').length}</p>
                <p className="text-xs text-gray-500">Processing</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-400">{jobs.filter((job) => job.status === 'queued').length}</p>
                <p className="text-xs text-gray-500">Queued</p>
              </div>
            </div>
            <div className="h-px bg-white/10 mb-4"></div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Completed</span>
              <span className="text-white font-medium">{jobs.filter((job) => job.status === 'completed').length}</span>
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-white/5 bg-gradient-to-br from-primary/5 to-transparent">
            <h4 className="text-gray-400 text-xs font-bold uppercase mb-4">Quick Access</h4>
            <Button variant="secondary" fullWidth className="h-8 text-xs border-primary/20 hover:border-primary/50" onClick={() => onNavigate('queue')}>
              Open Queue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
