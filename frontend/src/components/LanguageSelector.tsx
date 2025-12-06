import React from 'react';
import { SupportedLanguage } from '../types';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  current: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
}

const languages: { code: SupportedLanguage; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
  { code: 'de', label: 'DE' },
  { code: 'tr', label: 'TR' },
  { code: 'pt', label: 'PT' },
  { code: 'ar', label: 'AR' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ current, onChange }) => {
  return (
    <div className="relative group">
      <button className="flex items-center gap-1.5 text-text-secondary hover:text-white transition-colors text-sm font-medium">
        <Globe size={16} />
        <span className="uppercase">{current}</span>
      </button>
      
      <div className="absolute right-0 top-full mt-2 w-32 bg-surface border border-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="py-1">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => onChange(lang.code)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-800 transition-colors ${
                current === lang.code ? 'text-primary font-semibold' : 'text-text-secondary'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
