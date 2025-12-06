
import React, { useState } from 'react';
import { Search, Link as LinkIcon, Loader2 } from 'lucide-react';
import { Translations } from '../types';

interface HeroProps {
  onSearch: (query: string) => void;
  loading: boolean;
  t: Translations;
}

export const Hero: React.FC<HeroProps> = ({ onSearch, loading, t }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setQuery(text);
      // Optional: Auto-search if valid URL
      if (text.startsWith('http')) {
        onSearch(text);
      }
    } catch (err) {
      console.error('Clipboard access denied');
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-20 px-4 text-center space-y-8 animate-fadeIn">
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
          {t.heroTitle.split('.')[0]}. <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{t.heroTitle.split('.')[1] || 'Free.'}</span>
        </h1>
        <p className="text-lg text-gray-400 font-light">
          {t.heroSubtitle}
        </p>
      </div>

      <div className="w-full max-w-2xl relative group z-10">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <form onSubmit={handleSubmit} className="relative flex items-center bg-[#0b0b10] rounded-2xl p-2 border border-white/10 shadow-2xl">
          <Search className="text-gray-500 ml-4" size={24} />
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="flex-1 bg-transparent border-none outline-none text-white px-4 py-3 placeholder:text-gray-600 text-lg"
          />

          <div className="flex items-center gap-2 pr-2">
            {!query && (
              <button 
                type="button" 
                onClick={handlePaste}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-400 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <LinkIcon size={12} /> {t.pasteLink}
              </button>
            )}
            
            <button 
              type="submit" 
              disabled={loading}
              className="bg-primary hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : t.searchButton}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
