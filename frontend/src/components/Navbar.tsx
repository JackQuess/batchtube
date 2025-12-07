
import React, { useState } from 'react';
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
  const [showLangMenu, setShowLangMenu] = useState(false);

  return (
    <nav className="fixed top-0 inset-x-0 h-14 sm:h-16 bg-[#050509]/80 backdrop-blur-md border-b border-white/5 z-50 flex flex-col sm:flex-row items-center justify-between px-4 gap-4 sm:gap-0">
      {/* Logo */}
      <div className="flex items-center gap-2 cursor-pointer max-w-[200px] sm:max-w-none" onClick={() => window.location.reload()}>
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center relative overflow-hidden group flex-shrink-0">
          <div className="w-3 h-3 bg-white rounded-[1px] shadow-sm group-hover:scale-110 transition-transform"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
        </div>
        <span className="text-lg sm:text-xl font-bold tracking-tight text-white truncate">Batch<span className="text-primary">Tube</span></span>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto justify-center sm:justify-end">
        {/* Language Pill - Desktop */}
        <div className="hidden sm:flex bg-[#0b0b10] border border-white/10 rounded-full p-1 gap-1 overflow-x-auto">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`px-2 py-1 text-xs font-bold rounded-full transition-all whitespace-nowrap ${
                lang === l.code 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        
        {/* Mobile Language Dropdown */}
        <div className="relative sm:hidden">
          <button 
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            <Globe size={18} />
          </button>
          {showLangMenu && (
            <div className="absolute right-0 top-full mt-2 bg-[#0b0b10] border border-white/10 rounded-lg overflow-hidden z-20 min-w-[120px] shadow-xl">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    lang === l.code 
                      ? 'bg-primary/20 text-primary font-bold' 
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-xs font-mono text-gray-600 hidden md:block">
          {APP_VERSION}
        </span>
      </div>
    </nav>
  );
};
