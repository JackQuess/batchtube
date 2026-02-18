import React, { useMemo, useState } from 'react';
import { ViewState } from '../types';

interface SupportedSitesScreenProps {
  onNavigate: (view: ViewState) => void;
}

const siteCatalog = [
  { name: 'YouTube', category: 'Video', plan: 'Free' },
  { name: 'Vimeo', category: 'Video', plan: 'Pro' },
  { name: 'Dailymotion', category: 'Video', plan: 'Free' },
  { name: 'Twitch', category: 'Video', plan: 'Pro' },
  { name: 'TikTok', category: 'Social', plan: 'Free' },
  { name: 'Instagram', category: 'Social', plan: 'Pro' },
  { name: 'X / Twitter', category: 'Social', plan: 'Free' },
  { name: 'Reddit', category: 'Social', plan: 'Free' },
  { name: 'Facebook', category: 'Social', plan: 'Free' },
  { name: 'Pinterest', category: 'Social', plan: 'Pro' },
  { name: 'SoundCloud', category: 'Audio', plan: 'Free' },
  { name: 'Bandcamp', category: 'Audio', plan: 'Pro' },
  { name: 'Mixcloud', category: 'Audio', plan: 'Pro' },
  { name: 'Loom', category: 'Other', plan: 'Pro' },
  { name: 'Archive.org', category: 'Other', plan: 'Pro' },
  { name: 'Direct link (mp4/mp3)', category: 'Direct', plan: 'Free' }
] as const;

export const SupportedSitesScreen: React.FC<SupportedSitesScreenProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'All' | 'Video' | 'Social' | 'Audio' | 'Other' | 'Direct'>('All');

  const filtered = useMemo(() => {
    return siteCatalog.filter((site) => {
      const byCategory = category === 'All' || site.category === category;
      const byText = site.name.toLowerCase().includes(query.toLowerCase());
      return byCategory && byText;
    });
  }, [category, query]);

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-10 md:py-14 animate-in fade-in duration-500">
      <section className="max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
          Supported <span className="text-primary">sites</span>
        </h1>
        <p className="text-gray-400 mt-4 text-base">
          BatchTube detects provider types automatically. Free plan includes core sources, Pro unlocks the full catalog.
        </p>
      </section>

      <section className="mt-8 glass-card rounded-2xl p-5 border border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-500">search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search provider"
              className="w-full h-11 rounded-lg border border-white/10 bg-white/5 pl-10 pr-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50"
            />
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end">
            {(['All', 'Video', 'Social', 'Audio', 'Other', 'Direct'] as const).map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  category === item ? 'bg-primary text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((site) => (
          <div key={site.name} className="glass-card rounded-xl border border-white/10 p-4 hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">{site.name}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-semibold ${site.plan === 'Pro' ? 'text-primary border-primary/30 bg-primary/10' : 'text-gray-300 border-white/15 bg-black/30'}`}>
                {site.plan}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">{site.category}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-5 border border-white/10">
          <p className="text-xs uppercase tracking-wide text-gray-500">Free plan includes</p>
          <p className="text-sm text-gray-300 mt-2">Core social/video providers and direct media links.</p>
        </div>
        <div className="glass-card rounded-xl p-5 border border-primary/30 bg-primary/10">
          <p className="text-xs uppercase tracking-wide text-primary">Pro unlocks</p>
          <p className="text-sm text-gray-200 mt-2">Full provider catalog, higher limits, and faster queue priority.</p>
          <button onClick={() => onNavigate('pricing')} className="mt-3 text-sm text-primary hover:text-red-400 transition-colors">
            Compare plans
          </button>
        </div>
      </section>
    </div>
  );
};
