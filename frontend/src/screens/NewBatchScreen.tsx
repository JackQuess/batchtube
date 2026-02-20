import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { ViewState } from '../types';
import { ApiError } from '../lib/apiClient';
import { batchAPI } from '../services/batchAPI';
import { accountAPI } from '../services/accountAPI';
import { saveTrackedJob } from '../lib/trackedJobs';
import { getStoredUser } from '../lib/auth';

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

export const NewBatchScreen: React.FC<NewBatchScreenProps> = ({ onNavigate }) => {
  const user = getStoredUser();
  const [pasteValue, setPasteValue] = useState('');
  const [urlRows, setUrlRows] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp4');
  const [quality, setQuality] = useState<'1080p' | '4k'>('1080p');
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ available: number; used: number; limit: number; plan: string } | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);

  const urls = useMemo(() => urlRows, [urlRows]);
  const cost = urls.length;
  const maxLinks = usage?.plan === 'free' ? 10 : 50;
  const overBatchLimit = urls.length > maxLinks;
  const insufficientCredits = usage ? usage.available < cost : false;

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
        quality
      });

      saveTrackedJob({
        jobId: response.jobId,
        name: buildBatchName(),
        createdAt: new Date().toISOString(),
        itemsCount: urls.length,
        format,
        quality,
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
    <div className="w-full max-w-6xl mx-auto h-full flex flex-col gap-8 animate-in fade-in duration-500 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Create New Batch</h1>
        <Button variant="ghost" onClick={() => onNavigate('dashboard')} icon="close">
          Cancel
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 flex-1">
        <div className="flex-1 flex flex-col gap-4">
          <div className="glass-card rounded-xl p-4 border border-white/10">
            <div className="flex flex-col md:flex-row gap-3">
              <textarea
                value={pasteValue}
                onChange={(e) => setPasteValue(e.target.value)}
                placeholder="Linkleri yapıştır (satır satır veya boşlukla)"
                className="flex-1 h-24 bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-primary/40"
              />
              <div className="flex md:flex-col gap-2 md:w-40">
                <button
                  className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg border border-white/15 bg-white/5 hover:bg-white/10"
                  onClick={() => ingestInput(pasteValue)}
                  type="button"
                >
                  Paste links
                </button>
                <button
                  className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg border border-white/15 bg-white/5 hover:bg-white/10"
                  onClick={removeDuplicates}
                  type="button"
                >
                  Remove duplicates
                </button>
                <button
                  className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg border border-white/15 bg-white/5 hover:bg-white/10"
                  onClick={clearAll}
                  type="button"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl border border-white/10 overflow-hidden min-h-[360px]">
            <div className="bg-white/5 px-4 py-3 flex items-center justify-between border-b border-white/10">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Batch URLs</p>
              <p className="text-xs font-semibold text-primary">{urls.length} link</p>
            </div>
            <div className="max-h-[420px] overflow-y-auto divide-y divide-white/5">
              {urls.length === 0 ? (
                <p className="px-4 py-8 text-sm text-gray-500">Henüz link eklenmedi.</p>
              ) : (
                urls.map((url, index) => {
                  const host = new URL(url).hostname.replace(/^www\./, '');
                  const provider = providerFromHost(host);
                  return (
                    <div key={`${url}-${index}`} className="px-4 py-3 flex items-center gap-3">
                      <span className={`text-[11px] px-2 py-1 rounded border uppercase tracking-wide ${providerBadgeClass(provider)}`}>
                        {provider}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-400">{host}</p>
                        <p className="text-sm text-gray-200 truncate" title={url}>{url}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="text-gray-400 hover:text-red-400"
                        aria-label="Remove URL"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="w-full md:w-80 flex flex-col gap-6">
          <div className="glass-card p-6 rounded-xl space-y-6">
            <h3 className="font-semibold text-white border-b border-white/10 pb-3">Batch Options</h3>

            <div>
              <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Target Format</label>
              <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
                {(['mp4', 'mp3'] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => setFormat(item)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded ${format === item ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    {item.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Resolution Limit</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as '1080p' | '4k')}
                className="w-full bg-white/5 border border-white/10 rounded-lg text-white text-sm p-2.5 focus:border-primary focus:outline-none"
              >
                <option value="1080p">1080p</option>
                <option value="4k">4K</option>
              </select>
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl border-t-4 border-primary bg-gradient-to-b from-white/5 to-transparent space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Estimated Cost</span>
              <span className="text-white font-semibold">{cost} credit</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Credits</span>
              <span className="text-white font-semibold">
                {usageLoading ? '...' : usage ? `${usage.available} / ${usage.limit}` : '--'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Batch Limit</span>
              <span className="text-white font-semibold">{maxLinks} link</span>
            </div>

            {overBatchLimit && <p className="text-xs text-red-400">Plan limitini aştın. Bu batch için maksimum {maxLinks} link ekleyebilirsin.</p>}
            {!overBatchLimit && insufficientCredits && <p className="text-xs text-red-400">Yetersiz kredi. Batch başlatmak için plan yükselt.</p>}
            {!user && <p className="text-xs text-red-400">Batch başlatmak için giriş yapmalısın.</p>}
            {error && <p className="text-xs text-red-400">{error}</p>}

            <Button
              fullWidth
              onClick={handleStart}
              disabled={!user || urls.length === 0 || processing || overBatchLimit || insufficientCredits}
              icon={processing ? 'sync' : 'rocket_launch'}
              className={processing ? 'opacity-80' : ''}
            >
              {processing ? 'Processing...' : 'Start Batch'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
