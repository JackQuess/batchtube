import React from 'react';
import { Button } from '../components/Button';
import { ViewState } from '../types';

interface LandingScreenProps {
  onNavigate: (view: ViewState) => void;
}

const trustedProviders = ['YouTube', 'TikTok', 'Instagram', 'X', 'Vimeo', 'Twitch', 'Reddit', 'SoundCloud'];

export const LandingScreen: React.FC<LandingScreenProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-10 md:py-16 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        <section className="lg:col-span-7 text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary mb-6">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            Multi-provider engine is live
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.08] text-white">
            Process media batches across
            <span className="text-primary"> 30+ platforms</span>
          </h1>

          <p className="mt-6 text-base md:text-lg text-gray-400 max-w-2xl leading-relaxed">
            Drop mixed links from YouTube, TikTok, Instagram, X and more. BatchTube auto-detects providers,
            runs parallel jobs, and returns a clean ZIP in one flow.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button onClick={() => onNavigate('signup')} icon="rocket_launch" className="h-12 px-7">
              Get Started Free
            </Button>
            <Button variant="secondary" onClick={() => onNavigate('pricing')} className="h-12 px-7" icon="payments">
              See Pricing
            </Button>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 max-w-xl">
            <div>
              <p className="text-2xl font-bold text-white">30+</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Providers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">10x</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Faster Batches</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">1-Click</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">ZIP Delivery</p>
            </div>
          </div>
        </section>

        <section className="lg:col-span-5">
          <div className="glass-card rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Batch Preview</h3>
              <span className="text-xs text-emerald-400 font-semibold">Ready</span>
            </div>

            <div className="space-y-3">
              {[
                { title: 'youtube.com/watch?v=...', provider: 'YouTube', status: 'queued' },
                { title: 'tiktok.com/@creator/video/...', provider: 'TikTok', status: 'processing' },
                { title: 'instagram.com/reel/...', provider: 'Instagram', status: 'completed' }
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-white truncate">{item.title}</p>
                    <span className="text-[10px] rounded-full border border-white/15 bg-black/30 px-2 py-0.5 text-gray-300 uppercase font-semibold">
                      {item.provider}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Status: {item.status}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-primary/20 bg-primary/10 p-3">
              <p className="text-xs text-gray-300">
                Pro tip: Mixed-provider batches are automatically grouped and archived per source.
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-12 md:mt-16 glass-card rounded-2xl p-5 border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-sm text-gray-400">Supported providers</p>
          <button onClick={() => onNavigate('supported-sites')} className="text-sm text-primary hover:text-red-400 transition-colors text-left md:text-right">
            View all supported sites
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {trustedProviders.map((name) => (
            <span key={name} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300">
              {name}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
};
