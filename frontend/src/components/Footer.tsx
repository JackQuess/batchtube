
import React from 'react';
import { LegalDocType, Translations } from '../types';
import { resetCookieConsent } from '../lib/adLoader';

interface FooterProps {
  onOpenLegal: (type: LegalDocType) => void;
  t: Translations;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal, t }) => {
  return (
    <footer className="border-t border-white/5 bg-[#0b0b10] py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <div>
          BatchTube &copy; {new Date().getFullYear()}
        </div>
        
        <div className="flex items-center gap-6 flex-wrap justify-center">
          <button onClick={() => onOpenLegal('terms')} className="hover:text-primary transition-colors">{t.terms}</button>
          <button onClick={() => onOpenLegal('privacy')} className="hover:text-primary transition-colors">{t.privacy}</button>
          <button onClick={() => onOpenLegal('cookies')} className="hover:text-primary transition-colors">{t.cookies}</button>
          <button onClick={() => onOpenLegal('legal')} className="hover:text-primary transition-colors">{t.legal}</button>
          <button onClick={resetCookieConsent} className="hover:text-primary transition-colors">{t.cookie.reset}</button>
        </div>
      </div>
    </footer>
  );
};
