import React, { useState } from 'react';
import { Button } from '../components/Button';
import { ViewState } from '../types';

interface NewBatchScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const NewBatchScreen: React.FC<NewBatchScreenProps> = ({ onNavigate }) => {
  const [links, setLinks] = useState('');
  const [processing, setProcessing] = useState(false);

  const lineCount = links.split('\n').filter(l => l.trim().length > 0).length;

  const handleStart = () => {
    setProcessing(true);
    setTimeout(() => {
      onNavigate('queue');
    }, 1500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto h-full flex flex-col gap-8 animate-in fade-in duration-500 py-6">
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Create New Batch</h1>
        <Button variant="ghost" onClick={() => onNavigate('dashboard')} icon="close">Cancel</Button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 flex-1">
        {/* Main Input Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 glass-card rounded-xl p-1 flex flex-col min-h-[500px] border border-white/10 focus-within:border-primary/50 transition-colors shadow-2xl">
            <div className="bg-white/5 rounded-t-lg px-4 py-2 flex items-center justify-between border-b border-white/5">
               <span className="text-xs text-gray-400 font-mono">Source URLs</span>
               <span className="text-xs text-primary font-bold">{lineCount} Links Detected</span>
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

          {/* Supported Chips */}
          <div className="mt-4 flex flex-wrap gap-2 opacity-60">
             <span className="text-xs text-gray-500 mr-2 py-1">Supports:</span>
             {['YouTube', 'Instagram', 'TikTok', 'X/Twitter', 'SoundCloud', 'Twitch'].map(s => (
                <span key={s} className="text-[10px] px-2 py-1 bg-white/5 rounded text-gray-400 border border-white/5">{s}</span>
             ))}
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="w-full md:w-80 flex flex-col gap-6">
          <div className="glass-card p-6 rounded-xl space-y-6">
            <h3 className="font-semibold text-white border-b border-white/10 pb-3">Batch Options</h3>
            
            <div className="space-y-5">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Target Format</label>
                <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
                   {['MP4', 'MP3', 'MKV'].map(f => (
                      <button key={f} className={`flex-1 py-1.5 text-xs font-bold rounded ${f === 'MP4' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}>{f}</button>
                   ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Resolution Limit</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg text-white text-sm p-2.5 focus:border-primary focus:outline-none">
                  <option>Best Available</option>
                  <option>4K (2160p)</option>
                  <option>1080p</option>
                  <option>720p</option>
                </select>
              </div>

              <div className="pt-2 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-600 text-primary focus:ring-primary bg-transparent" />
                  <span className="text-sm text-gray-300 group-hover:text-white">Zip all files together</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-600 text-primary focus:ring-primary bg-transparent" />
                  <span className="text-sm text-gray-300 group-hover:text-white">Generate playlist file (.m3u)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl border-t-4 border-primary bg-gradient-to-b from-white/5 to-transparent">
            <div className="flex justify-between items-end mb-4">
               <span className="text-gray-400 text-sm">Est. Processing</span>
               <span className="text-xl font-bold text-white">~{Math.max(10, lineCount * 5)}s</span>
            </div>
            <Button 
              fullWidth 
              onClick={handleStart}
              disabled={lineCount === 0 || processing}
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