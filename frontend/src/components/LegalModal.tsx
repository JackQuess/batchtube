import React from 'react';
import { LegalDocType, SupportedLanguage, Translations } from '../types';
import { LEGAL_TEXTS } from '../constants';
import { X, Scale } from 'lucide-react';

interface LegalModalProps {
  type: LegalDocType | null;
  onClose: () => void;
  t: Translations;
  lang: SupportedLanguage;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose, t, lang }) => {
  if (!type) return null;

  const content = LEGAL_TEXTS[lang]?.[type] || LEGAL_TEXTS.en[type];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[#0b0b10] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>

        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Scale className="text-primary" size={20} />
            {t[type]}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 text-gray-300 leading-relaxed whitespace-pre-wrap font-light">
          {content || t.metadataUnavailable}
        </div>

        <div className="p-4 border-t border-white/5 bg-[#050509] flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm">
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
};
