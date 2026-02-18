import React, { useState } from 'react';
import { ViewState } from '../types';
import { Button } from '../components/Button';

interface SupportedSitesScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const SupportedSitesScreen: React.FC<SupportedSitesScreenProps> = ({ onNavigate }) => {
  const [filter, setFilter] = useState('All');
  const sites = [
    { name: 'YouTube', category: 'Video', pro: false },
    { name: 'TikTok', category: 'Social', pro: false },
    { name: 'Instagram', category: 'Social', pro: true },
    { name: 'Vimeo', category: 'Video', pro: true },
    { name: 'SoundCloud', category: 'Audio', pro: false },
    { name: 'Twitter / X', category: 'Social', pro: false },
    { name: 'Twitch', category: 'Video', pro: true },
    { name: 'Spotify', category: 'Audio', pro: true },
    { name: 'Reddit', category: 'Social', pro: false },
    { name: 'Facebook', category: 'Social', pro: false },
    { name: 'Pinterest', category: 'Social', pro: true },
    { name: 'Dailymotion', category: 'Video', pro: false },
  ];

  const filteredSites = filter === 'All' ? sites : sites.filter(s => s.category === filter);

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
             Supported <span className="text-primary">Platforms</span>
          </h1>
          <p className="text-gray-400 text-lg">
             BatchTube supports over 100+ websites. Free plan includes core providers. Pro unlocks everything.
          </p>
          
          <div className="mt-8 relative max-w-md mx-auto">
             <input 
               type="text" 
               placeholder="Search for a site..." 
               className="w-full h-12 pl-12 pr-4 rounded-full bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary focus:bg-white/10 transition-all placeholder-gray-500"
             />
             <span className="material-symbols-outlined absolute left-4 top-3 text-gray-500">search</span>
          </div>
       </div>

       {/* Tabs */}
       <div className="flex justify-center gap-2 mb-12 flex-wrap">
          {['All', 'Video', 'Social', 'Audio'].map((cat) => (
             <button 
               key={cat}
               onClick={() => setFilter(cat)}
               className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${filter === cat ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
             >
               {cat}
             </button>
          ))}
       </div>

       {/* Grid */}
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredSites.map((site, idx) => (
             <div key={idx} className="glass-card p-6 rounded-xl flex items-center justify-between group hover:border-primary/30 transition-all">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold text-white group-hover:bg-primary group-hover:text-white transition-colors">
                      {site.name.charAt(0)}
                   </div>
                   <div>
                      <h4 className="font-bold text-white">{site.name}</h4>
                      <p className="text-xs text-gray-500">{site.category}</p>
                   </div>
                </div>
                {site.pro ? (
                   <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase border border-primary/20">Pro</span>
                ) : (
                   <span className="px-2 py-0.5 rounded bg-white/10 text-gray-400 text-[10px] font-bold uppercase border border-white/10">Free</span>
                )}
             </div>
          ))}
       </div>
    </div>
  );
};