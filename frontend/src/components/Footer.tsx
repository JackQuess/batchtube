import React from 'react';
import { LegalDocType, Translations } from '../types';
import { Link } from 'react-router-dom';

interface FooterProps {
  onOpenLegal?: (type: LegalDocType) => void;
  t: Translations;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal, t }) => {
  const legalButton = (type: LegalDocType, label: string) =>
    onOpenLegal ? (
      <button onClick={() => onOpenLegal(type)} className="hover:text-primary transition-colors text-xs sm:text-sm">
        {label}
      </button>
    ) : (
      <Link to={`/${type}`} className="hover:text-primary transition-colors text-xs sm:text-sm">
        {label}
      </Link>
    );

  return (
    <footer className="border-t border-white/5 bg-[#0b0b10] py-6 sm:py-8 mt-auto relative z-10">
      <div className="max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 sm:gap-4 text-xs text-neutral-500">
        {/* Left: Copyright */}
        <div className="text-center sm:text-left">
          © {new Date().getFullYear()} BatchTube — {t.allRightsReserved}
        </div>

        {/* Right: Links */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
          <Link to="/how-it-works" className="hover:text-primary transition-colors text-xs sm:text-sm">
            {t.howItWorks}
          </Link>
          <span className="text-gray-600">·</span>
          <Link to="/faq" className="hover:text-primary transition-colors text-xs sm:text-sm">
            {t.faq}
          </Link>
          <span className="text-gray-600">·</span>
          <Link to="/supported-sites" className="hover:text-primary transition-colors text-xs sm:text-sm">
            {t.supportedSites}
          </Link>
          <span className="text-gray-600">·</span>
          {legalButton('legal', t.legal)}
          <span className="text-gray-600">·</span>
          {legalButton('terms', t.terms)}
          <span className="text-gray-600">·</span>
          {legalButton('privacy', t.privacy)}
          <span className="text-gray-600">·</span>
          {legalButton('cookies', t.cookies)}
        </div>
      </div>
    </footer>
  );
};
