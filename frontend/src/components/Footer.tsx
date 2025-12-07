
import React from 'react';
import { LegalDocType, Translations } from '../types';
import { resetCookieConsent } from '../lib/adLoader';

interface FooterProps {
  onOpenLegal: (type: LegalDocType) => void;
  t: Translations;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal, t }) => {
  return (
    <footer className="border-t border-white/5 bg-[#0b0b10] py-6 sm:py-8 mt-auto relative z-10">
      <div className="max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 sm:gap-4 text-xs text-neutral-500">
        {/* Left: Copyright */}
        <div className="text-center sm:text-left">
          © {new Date().getFullYear()} BatchTube — All rights reserved.
        </div>
        
        {/* Right: Legal Links */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
          <button onClick={() => onOpenLegal('legal')} className="hover:text-primary transition-colors text-xs sm:text-sm">Legal</button>
          <span className="text-gray-600">·</span>
          <button onClick={() => onOpenLegal('terms')} className="hover:text-primary transition-colors text-xs sm:text-sm">Terms</button>
          <span className="text-gray-600">·</span>
          <button onClick={() => onOpenLegal('privacy')} className="hover:text-primary transition-colors text-xs sm:text-sm">Privacy</button>
          <span className="text-gray-600">·</span>
          <button onClick={() => onOpenLegal('cookies')} className="hover:text-primary transition-colors text-xs sm:text-sm">Cookies</button>
        </div>
      </div>
    </footer>
  );
};
