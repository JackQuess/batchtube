import React from 'react';
import { Button } from '../components/Button';
import { ViewState } from '../types';

interface LandingScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center text-center justify-center min-h-[85vh] w-full max-w-5xl mx-auto px-6 animate-in fade-in duration-700">
      
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-primary mb-8 hover:bg-white/10 transition-colors cursor-pointer">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
        New: TikTok & Instagram Reels Support
      </div>

      <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 leading-[1.1]">
        Batch downloads across <br/> <span className="text-primary">30+ platforms.</span>
      </h1>
      
      <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed font-light">
        Paste a list of links. We auto-detect the sources, process them in parallel, and deliver a single ZIP file.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-20">
        <Button 
            onClick={() => onNavigate('signup')} 
            className="px-8 text-base h-14"
            icon="bolt"
        >
            Start Free Trial
        </Button>
        <Button 
            variant="secondary" 
            className="px-8 text-base h-14"
            icon="play_circle"
        >
            View Demo
        </Button>
      </div>

      {/* Value Props */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl mb-24">
         <div className="glass-card p-6 rounded-xl text-left border border-white/5">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
               <span className="material-symbols-outlined">smart_toy</span>
            </div>
            <h3 className="text-white font-bold mb-2">Provider Auto-Detect</h3>
            <p className="text-sm text-gray-400">Paste mixed links from YouTube, TikTok, and X. Our engine sorts them instantly.</p>
         </div>
         <div className="glass-card p-6 rounded-xl text-left border border-white/5">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
               <span className="material-symbols-outlined">queue_music</span>
            </div>
            <h3 className="text-white font-bold mb-2">Parallel Queue</h3>
            <p className="text-sm text-gray-400">Download hundreds of files simultaneously with our high-bandwidth workers.</p>
         </div>
         <div className="glass-card p-6 rounded-xl text-left border border-white/5">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
               <span className="material-symbols-outlined">folder_zip</span>
            </div>
            <h3 className="text-white font-bold mb-2">One-Click ZIP</h3>
            <p className="text-sm text-gray-400">No more manual saving. Get your entire batch as a neat, organized ZIP archive.</p>
         </div>
      </div>

      {/* Supported Platforms Teaser */}
      <div className="w-full max-w-3xl border-t border-white/5 pt-12 pb-8">
         <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Supported Platforms</p>
         <div className="flex flex-wrap justify-center gap-3 opacity-70">
            {['YouTube', 'Instagram', 'TikTok', 'Twitter / X', 'Twitch', 'SoundCloud', 'Vimeo', 'Facebook', 'Pinterest', 'Reddit', 'DailyMotion', 'Bandcamp'].map((site) => (
               <span key={site} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">
                  {site}
               </span>
            ))}
            <button onClick={() => onNavigate('supported-sites')} className="px-3 py-1.5 rounded-full border border-primary/30 text-primary text-xs hover:bg-primary/10 transition-colors">
               + 20 more
            </button>
         </div>
      </div>
    </div>
  );
};
