
import React from 'react';
import { SupportedLanguage } from '../types';
import { APP_VERSION } from '../constants';
import { Globe } from 'lucide-react';

interface NavbarProps {
  lang: SupportedLanguage;
  setLang: (l: SupportedLanguage) => void;
}

const LANGUAGES: {code: SupportedLanguage, label: string}[] = [
  { code: 'tr', label: 'TR' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'de', label: 'DE' },
  { code: 'fr', label: 'FR' },
  { code: 'pt', label: 'PT' },
  { code: 'ar', label: 'AR' },
];

export const Navbar: React.FC<NavbarProps> = ({ lang, setLang }) => {
  return (
    <nav className="fixed top-0 inset-x-0 h-16 bg-[#050509]/80 backdrop-blur-md border-b border-white/5 z-50 flex items-center justify-between px-4 lg:px-8">
      {/* Logo */}
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center relative overflow-hidden group">
          <div className="w-3 h-3 bg-white rounded-[1px] shadow-sm group-hover:scale-110 transition-transform"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
        </div>
        <span className="text-xl font-bold tracking-tight text-white">Batch<span className="text-primary">Tube</span></span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Language Pill */}
        <div className="hidden sm:flex bg-[#0b0b10] border border-white/10 rounded-full p-1 gap-1">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`px-2 py-1 text-xs font-bold rounded-full transition-all ${
                lang === l.code 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        
        {/* Mobile Simple Lang Switch */}
        <button className="sm:hidden text-gray-400">
           <Globe size={20} />
        </button>

        <span className="text-xs font-mono text-gray-600 hidden md:block">
          {APP_VERSION}
        </span>
      </div>
    </nav>
  );
};
