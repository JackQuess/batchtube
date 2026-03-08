import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Video, Headphones, Film, Zap, PlusCircle, ArrowRight } from 'lucide-react';
import { ViewState } from '../types';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { batchAPI, BatchJobStatus } from '../services/batchAPI';
import { listTrackedJobs, saveTrackedJob } from '../lib/trackedJobs';

type FormatOption = 'mp3' | 'mp4' | 'mkv';
type QualityOption = 'best' | '720p' | '1080p' | '4k';

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

const FORMAT_OPTIONS: { id: FormatOption; label: string; icon: React.ReactNode }[] = [
  { id: 'mp4', label: 'MP4', icon: <Video className="w-4 h-4" /> },
  { id: 'mp3', label: 'MP3', icon: <Headphones className="w-4 h-4" /> },
  { id: 'mkv', label: 'MKV', icon: <Film className="w-4 h-4" /> }
];

const QUALITY_OPTIONS: { id: QualityOption; label: string }[] = [
  { id: 'best', label: 'Best' },
  { id: '720p', label: '720p' },
  { id: '1080p', label: '1080p' },
  { id: '4k', label: '4K' }
];

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const [links, setLinks] = useState('');
  const [format, setFormat] = useState<FormatOption>('mp4');
  const [quality, setQuality] = useState<QualityOption>('best');
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<DashboardBatch[]>([]);

  const urls = useMemo(() => links.split('\n').map((line) => line.trim()).filter(Boolean), [links]);
  const isAudio = format === 'mp3';

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
        quality: isAudio ? 'best' : quality
      });

      saveTrackedJob({
        jobId: response.jobId,
        name: `Batch_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}`,
        createdAt: new Date().toISOString(),
        itemsCount: urls.length,
        format,
        quality: isAudio ? 'best' : quality,
        urls
      });

      setLinks('');
      onNavigate('queue');
    } catch (err: unknown) {
      setStartError(err instanceof Error ? err.message : 'Batch başlatılamadı.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-7xl mx-auto space-y-8"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="glass-panel rounded-2xl border border-white/5 overflow-hidden shadow-2xl shadow-black/30"
      >
        <div className="bg-gradient-to-r from-white/5 to-transparent px-6 py-4 border-b border-white/5 flex justify-between items-center">
          <h2 className="font-bold text-white flex items-center gap-2 text-lg">
            <PlusCircle className="w-5 h-5 text-app-primary" />
            Create New Batch
          </h2>
          <button
            onClick={() => onNavigate('new-batch')}
            className="text-sm text-app-primary font-semibold hover:underline flex items-center gap-1"
          >
            Advanced editor <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <textarea
              className="w-full h-40 bg-black/30 border border-white/10 rounded-xl p-4 text-sm font-mono text-gray-300 focus:outline-none focus:border-app-primary/50 focus:ring-1 focus:ring-app-primary/20 placeholder-gray-500 resize-none transition-all"
              placeholder="Paste links from YouTube, TikTok, Instagram, X, SoundCloud...&#10;One link per line."
              value={links}
              onChange={(e) => setLinks(e.target.value)}
            />
            <p className="text-xs text-app-muted">{urls.length} link detected</p>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <label className="text-xs text-app-muted uppercase font-bold mb-2 block">Output format</label>
              <div className="grid grid-cols-3 gap-2">
                {FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setFormat(opt.id)}
                    className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                      format === opt.id
                        ? 'bg-app-primary/20 text-app-primary border-app-primary/50'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-app-muted uppercase font-bold mb-2 block">
                {isAudio ? 'Audio' : 'Quality'}
              </label>
              {isAudio ? (
                <div className="py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400">
                  Best available
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {QUALITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setQuality(opt.id)}
                      className={`py-2 px-3 rounded-xl border text-sm font-semibold transition-all ${
                        quality === opt.id
                          ? 'bg-app-primary/20 text-app-primary border-app-primary/50'
                          : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {startError && <p className="text-xs text-red-400">{startError}</p>}

            <Button
              fullWidth
              icon="rocket_launch"
              onClick={handleStartBatch}
              disabled={!urls.length || starting}
              className="mt-1"
            >
              {starting ? 'Starting...' : 'Start Batch'}
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-app-primary" /> Active Batches
          </h3>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-panel rounded-2xl overflow-hidden border border-white/5"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-white/5 text-gray-200 uppercase text-xs font-semibold">
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
                      <td className="px-6 py-10 text-sm text-app-muted text-center" colSpan={4}>
                        Henüz batch yok. Link ekleyip başlat.
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4 font-medium text-white">
                          <div className="flex flex-col">
                            <span>{job.name}</span>
                            <span className="text-xs text-gray-500">{job.files} items</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 w-40">
                          <div className="h-1.5 bg-gray-700/80 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-app-primary rounded-full transition-all duration-500"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge status={job.status} />
                        </td>
                        <td className="px-6 py-4 text-xs text-app-muted">{toRelativeTime(job.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white">System Status</h3>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="glass-panel p-6 rounded-2xl border border-white/5"
          >
            <h4 className="text-app-muted text-xs font-bold uppercase mb-4">Queue Health</h4>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-2xl font-bold text-white">{jobs.filter((j) => j.status === 'processing').length}</p>
                <p className="text-xs text-app-muted">Processing</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-400">{jobs.filter((j) => j.status === 'queued').length}</p>
                <p className="text-xs text-app-muted">Queued</p>
              </div>
            </div>
            <div className="h-px bg-white/10 mb-4" />
            <div className="flex justify-between items-center text-sm">
              <span className="text-app-muted">Completed</span>
              <span className="text-white font-medium">{jobs.filter((j) => j.status === 'completed').length}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-app-primary/10 to-transparent"
          >
            <h4 className="text-app-muted text-xs font-bold uppercase mb-4">Quick Access</h4>
            <Button
              variant="secondary"
              fullWidth
              className="h-10 text-sm border-app-primary/20 hover:border-app-primary/50"
              onClick={() => onNavigate('queue')}
            >
              Open Queue
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
