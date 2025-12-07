
import React from 'react';
import { LegalDocType, Translations } from '../types';
import { resetCookieConsent } from '../lib/adLoader';

interface FooterProps {
  onOpenLegal: (type: LegalDocType) => void;
  t: Translations;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal, t }) => {
  return (
    <footer className="border-t border-white/5 bg-[#0b0b10] py-8 mt-auto relative z-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        {/* Left: Copyright */}
        <div>
          © {new Date().getFullYear()} BatchTube — All rights reserved.
        </div>
        
        {/* Right: Legal Links */}
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <button onClick={() => onOpenLegal('legal')} className="hover:text-primary transition-colors">Legal</button>
          <span className="text-gray-600">·</span>
          <button onClick={() => onOpenLegal('terms')} className="hover:text-primary transition-colors">Terms</button>
          <span className="text-gray-600">·</span>
          <button onClick={() => onOpenLegal('privacy')} className="hover:text-primary transition-colors">Privacy</button>
          <span className="text-gray-600">·</span>
          <button onClick={() => onOpenLegal('cookies')} className="hover:text-primary transition-colors">Cookies</button>
        </div>
      </div>
    </footer>
  );
};
