import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Video, Headphones, Film, Link2, Trash2, X, Zap, Copy, Eraser } from 'lucide-react';
import { Button } from '../components/Button';
import { ViewState } from '../types';
import { ApiError } from '../lib/apiClient';
import { batchAPI } from '../services/batchAPI';
import { accountAPI } from '../services/accountAPI';
import { saveTrackedJob } from '../lib/trackedJobs';
import { getStoredUser } from '../lib/auth';

type FormatOption = 'mp4' | 'mp3' | 'mkv';
type QualityOption = 'best' | '720p' | '1080p' | '4k';

interface NewBatchScreenProps {
  onNavigate: (view: ViewState) => void;
}

const buildBatchName = () => {
  const date = new Date();
  return `Batch_${date.toISOString().slice(0, 19).replace(/[:T]/g, '-')}`;
};

const normalizeUrl = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
};

const providerFromHost = (host: string) => {
  const value = host.toLowerCase();
  if (value.includes('youtube') || value.includes('youtu.be')) return 'youtube';
  if (value.includes('tiktok')) return 'tiktok';
  if (value.includes('instagram')) return 'instagram';
  if (value.includes('twitter') || value.includes('x.com')) return 'twitter';
  if (value.includes('soundcloud')) return 'soundcloud';
  if (value.includes('vimeo')) return 'vimeo';
  return 'generic';
};

const providerBadgeClass = (provider: string) => {
  if (provider === 'youtube') return 'bg-red-500/15 text-red-300 border-red-500/30';
  if (provider === 'tiktok') return 'bg-cyan-500/15 text-cyan-200 border-cyan-500/30';
  if (provider === 'instagram') return 'bg-pink-500/15 text-pink-200 border-pink-500/30';
  if (provider === 'twitter') return 'bg-sky-500/15 text-sky-200 border-sky-500/30';
  if (provider === 'soundcloud') return 'bg-orange-500/15 text-orange-200 border-orange-500/30';
  return 'bg-white/5 text-gray-300 border-white/10';
};

const FORMAT_OPTIONS: { id: FormatOption; label: string; icon: React.ReactNode }[] = [
  { id: 'mp4', label: 'MP4 Video', icon: <Video className="w-4 h-4" /> },
  { id: 'mp3', label: 'MP3 Audio', icon: <Headphones className="w-4 h-4" /> },
  { id: 'mkv', label: 'MKV Video', icon: <Film className="w-4 h-4" /> }
];

const QUALITY_OPTIONS: { id: QualityOption; label: string }[] = [
  { id: 'best', label: 'Best available' },
  { id: '720p', label: '720p' },
  { id: '1080p', label: '1080p' },
  { id: '4k', label: '4K' }
];

export const NewBatchScreen: React.FC<NewBatchScreenProps> = ({ onNavigate }) => {
  const user = getStoredUser();
  const [pasteValue, setPasteValue] = useState('');
  const [urlRows, setUrlRows] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [format, setFormat] = useState<FormatOption>('mp4');
  const [quality, setQuality] = useState<QualityOption>('best');
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ available: number; used: number; limit: number; plan: string } | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);

  const urls = useMemo(() => urlRows, [urlRows]);
  const cost = urls.length;
  const maxLinks = usage?.plan === 'free' ? 10 : 50;
  const overBatchLimit = urls.length > maxLinks;
  const insufficientCredits = usage ? usage.available < cost : false;
  const isAudio = format === 'mp3';

  const refreshUsage = async () => {
    setUsageLoading(true);
    try {
      const summary = await accountAPI.getUsage();
      setUsage({
        available: summary.credits.available,
        used: summary.credits.used,
        limit: summary.credits.limit,
        plan: summary.plan
      });
    } catch {
      setUsage(null);
    } finally {
      setUsageLoading(false);
    }
  };

  useEffect(() => {
    void refreshUsage();
  }, []);

  const ingestInput = (raw: string) => {
    const parsed = raw
      .split(/\r?\n|\s+/)
      .map((line) => normalizeUrl(line))
      .filter((line): line is string => Boolean(line));

    if (parsed.length === 0) return;
    setUrlRows((prev) => [...prev, ...parsed]);
    setPasteValue('');
  };

  const removeDuplicates = () => {
    setUrlRows((prev) => Array.from(new Set(prev)));
  };

  const clearAll = () => setUrlRows([]);

  const removeRow = (index: number) => {
    setUrlRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStart = async () => {
    if (urls.length === 0 || processing || overBatchLimit) return;

    setProcessing(true);
    setError(null);

    try {
      const response = await batchAPI.createJob({
        items: urls.map((url, index) => ({
          url,
          title: `Item ${index + 1}`
        })),
        format,
        quality: isAudio ? 'best' : quality
      });

      saveTrackedJob({
        jobId: response.jobId,
        name: buildBatchName(),
        createdAt: new Date().toISOString(),
        itemsCount: urls.length,
        format,
        quality: isAudio ? 'best' : quality,
        urls
      });

      setUrlRows([]);
      void refreshUsage();
      window.dispatchEvent(new Event('batchtube:usage-refresh'));
      onNavigate('queue');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'insufficient_credits') {
          setError('Yetersiz kredi. Planını yükselterek devam edebilirsin.');
        } else if (err.code === 'system_busy') {
          setError('Sistem yoğun. Lütfen kısa süre sonra tekrar dene.');
        } else {
          setError(err.message || 'Batch başlatılamadı.');
        }
      } else {
        setError('Batch başlatılamadı.');
      }
      void refreshUsage();
      window.dispatchEvent(new Event('batchtube:usage-refresh'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-6xl mx-auto h-full flex flex-col gap-8 py-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Create New Batch</h1>
        <Button variant="ghost" onClick={() => onNavigate('dashboard')} icon="close">
          Cancel
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        <div className="flex-1 flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="glass-panel rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-colors"
          >
            <div className="flex flex-col md:flex-row gap-3">
              <textarea
                value={pasteValue}
                onChange={(e) => setPasteValue(e.target.value)}
                placeholder="Linkleri yapıştır (satır satır veya boşlukla)"
                className="flex-1 min-h-[100px] bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-app-primary/50 focus:ring-1 focus:ring-app-primary/20 transition-all"
              />
              <div className="flex md:flex-col gap-2 md:w-44">
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                  onClick={() => ingestInput(pasteValue)}
                  type="button"
                >
                  <Copy className="w-3.5 h-3.5" /> Paste links
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                  onClick={removeDuplicates}
                  type="button"
                >
                  <Link2 className="w-3.5 h-3.5" /> Remove duplicates
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-red-300 transition-all"
                  onClick={clearAll}
                  type="button"
                >
                  <Eraser className="w-3.5 h-3.5" /> Clear
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-panel rounded-2xl border border-white/5 overflow-hidden min-h-[340px]"
          >
            <div className="bg-gradient-to-r from-white/5 to-transparent px-5 py-4 flex items-center justify-between border-b border-white/10">
              <p className="text-xs text-app-muted uppercase tracking-wider font-semibold">Batch URLs</p>
              <span className="text-sm font-bold text-app-primary">{urls.length} link</span>
            </div>
            <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5">
              {urls.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm text-gray-500">Henüz link eklenmedi.</p>
                  <p className="text-xs text-gray-600 mt-1">Yukarıdaki alana linkleri yapıştırıp &quot;Paste links&quot; ile ekle.</p>
                </div>
              ) : (
                urls.map((url, index) => {
                  const host = new URL(url).hostname.replace(/^www\./, '');
                  const provider = providerFromHost(host);
                  return (
                    <div
                      key={`${url}-${index}`}
                      className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <span className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium uppercase tracking-wide shrink-0 ${providerBadgeClass(provider)}`}>
                        {provider}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500">{host}</p>
                        <p className="text-sm text-gray-200 truncate" title={url}>{url}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                        aria-label="Remove URL"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>

        <div className="w-full lg:w-96 flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6"
          >
            <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-app-primary" /> Batch Options
            </h3>

            <div>
              <label className="text-xs text-app-muted uppercase font-bold block mb-3">Output format</label>
              <div className="grid grid-cols-3 gap-2">
                {FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setFormat(opt.id)}
                    className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border text-xs font-semibold transition-all ${
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
              <label className="text-xs text-app-muted uppercase font-bold block mb-3">
                {isAudio ? 'Audio quality' : 'Video resolution'}
              </label>
              {isAudio ? (
                <div className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300">
                  Best available (highest bitrate)
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {QUALITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setQuality(opt.id)}
                      className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all ${
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-6 rounded-2xl border-t-4 border-app-primary bg-gradient-to-b from-app-primary/10 to-transparent space-y-4"
          >
            <div className="flex justify-between text-sm">
              <span className="text-app-muted">Estimated cost</span>
              <span className="text-white font-semibold">{cost} credit</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-app-muted">Credits</span>
              <span className="text-white font-semibold">
                {usageLoading ? '...' : usage ? `${usage.available} / ${usage.limit}` : '--'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-app-muted">Batch limit</span>
              <span className="text-white font-semibold">{maxLinks} link</span>
            </div>

            <div className="pt-2 space-y-1">
              {overBatchLimit && <p className="text-xs text-red-400">Plan limitini aştın. Maksimum {maxLinks} link.</p>}
              {!overBatchLimit && insufficientCredits && <p className="text-xs text-red-400">Yetersiz kredi. Plan yükselt.</p>}
              {!user && <p className="text-xs text-red-400">Batch başlatmak için giriş yap.</p>}
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>

            <Button
              fullWidth
              onClick={handleStart}
              disabled={!user || urls.length === 0 || processing || overBatchLimit || insufficientCredits}
              icon={processing ? 'sync' : 'rocket_launch'}
              className={`mt-2 ${processing ? 'opacity-80' : ''}`}
            >
              {processing ? 'Starting...' : 'Start Batch'}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
