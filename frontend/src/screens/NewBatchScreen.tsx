import React, { useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { ViewState } from '../types';
import { batchAPI } from '../services/batchAPI';
import { saveTrackedJob } from '../lib/trackedJobs';

interface NewBatchScreenProps {
  onNavigate: (view: ViewState) => void;
}

const buildBatchName = () => {
  const date = new Date();
  return `Batch_${date.toISOString().slice(0, 19).replace(/[:T]/g, '-')}`;
};

export const NewBatchScreen: React.FC<NewBatchScreenProps> = ({ onNavigate }) => {
  const [links, setLinks] = useState('');
  const [processing, setProcessing] = useState(false);
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp4');
  const [quality, setQuality] = useState<'1080p' | '4k'>('1080p');
  const [error, setError] = useState<string | null>(null);

  const urls = useMemo(
    () => links.split('\n').map((line) => line.trim()).filter(Boolean),
    [links]
  );

  const handleStart = async () => {
    if (urls.length === 0 || processing) return;

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

      onNavigate('queue');
    } catch (err: any) {
      setError(err?.message || 'Batch başlatılamadı.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto h-full flex flex-col gap-8 animate-in fade-in duration-500 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Create New Batch</h1>
        <Button variant="ghost" onClick={() => onNavigate('dashboard')} icon="close">
          Cancel
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 flex-1">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 glass-card rounded-xl p-1 flex flex-col min-h-[500px] border border-white/10 focus-within:border-primary/50 transition-colors shadow-2xl">
            <div className="bg-white/5 rounded-t-lg px-4 py-2 flex items-center justify-between border-b border-white/5">
              <span className="text-xs text-gray-400 font-mono">Source URLs</span>
              <span className="text-xs text-primary font-bold">{urls.length} Links Detected</span>
            </div>
            <textarea
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              placeholder="Paste multiple URLs here (YouTube, TikTok, Instagram, etc.)&#10;One link per line..."
              className="flex-1 w-full bg-transparent border-none text-white p-6 font-mono text-sm resize-none focus:ring-0 focus:outline-none placeholder-gray-700 leading-relaxed"
              spellCheck={false}
              autoFocus
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2 opacity-60">
            <span className="text-xs text-gray-500 mr-2 py-1">Supports:</span>
            {['YouTube', 'Instagram', 'TikTok', 'X/Twitter', 'SoundCloud', 'Twitch'].map((item) => (
              <span key={item} className="text-[10px] px-2 py-1 bg-white/5 rounded text-gray-400 border border-white/5">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="w-full md:w-80 flex flex-col gap-6">
          <div className="glass-card p-6 rounded-xl space-y-6">
            <h3 className="font-semibold text-white border-b border-white/10 pb-3">Batch Options</h3>

            <div className="space-y-5">
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
          </div>

          <div className="glass-card p-6 rounded-xl border-t-4 border-primary bg-gradient-to-b from-white/5 to-transparent">
            <div className="flex justify-between items-end mb-4">
              <span className="text-gray-400 text-sm">Est. Processing</span>
              <span className="text-xl font-bold text-white">~{Math.max(10, urls.length * 5)}s</span>
            </div>

            {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

            <Button fullWidth onClick={handleStart} disabled={urls.length === 0 || processing} icon={processing ? 'sync' : 'rocket_launch'} className={processing ? 'opacity-80' : ''}>
              {processing ? 'Processing...' : 'Start Batch'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
