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
      if (text.startsWith('http')) {
        onSearch(text);
      }
    } catch (err) {
      console.error('Clipboard access denied');
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-8 sm:py-12 md:py-16 text-center space-y-4 sm:space-y-6 animate-fadeIn">
      <div className="space-y-3 sm:space-y-4 max-w-2xl w-full px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
          {t.heroTitle.split('.')[0]}.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            {t.heroTitle.split('.')[1] || 'Free.'}
          </span>
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 font-light max-w-md mx-auto">
          {t.heroSubtitle}
        </p>
      </div>

      <div className="w-full max-w-xl mx-auto px-4 relative group z-10">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-[#0b0b10] rounded-2xl p-2 border border-white/10 shadow-2xl gap-3 sm:gap-2">
          <div className="flex items-center flex-1">
            <Search className="text-gray-500 ml-4 flex-shrink-0" size={20} />

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="flex-1 w-full bg-transparent border-none outline-none text-white px-4 py-3 placeholder:text-gray-600 text-sm sm:text-base"
            />
          </div>

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
              className="w-full sm:w-auto bg-primary hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-sm sm:text-base transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : t.searchButton}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
