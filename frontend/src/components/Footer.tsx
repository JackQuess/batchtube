
import React from 'react';
import { Translations } from '../types';
import { AppLink } from '../lib/simpleRouter';

interface FooterProps {
  t: Translations;
}

export const Footer: React.FC<FooterProps> = ({ t }) => {
  return (
    <footer className="border-t border-white/5 bg-[#0b0b10] py-6 sm:py-8 mt-auto relative z-10">
      <div className="max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 sm:gap-4 text-xs text-neutral-500">
        {/* Left: Copyright */}
        <div className="text-center sm:text-left">
          © {new Date().getFullYear()} BatchTube — {t.allRightsReserved}
        </div>
        
        {/* Right: Site Links */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
          <AppLink to="/how-it-works" className="hover:text-primary transition-colors text-xs sm:text-sm">
            {t.howItWorks}
          </AppLink>
          <span className="text-gray-600">·</span>
          <AppLink to="/faq" className="hover:text-primary transition-colors text-xs sm:text-sm">
            {t.faq}
          </AppLink>
          <span className="text-gray-600">·</span>
          <AppLink to="/supported-sites" className="hover:text-primary transition-colors text-xs sm:text-sm">
            {t.supportedSites}
          </AppLink>
          <span className="text-gray-600">·</span>
          <AppLink to="/pricing" className="hover:text-primary transition-colors text-xs sm:text-sm">
            {t.pricing}
          </AppLink>
          <span className="text-gray-600">·</span>
          <AppLink to="/legal" className="hover:text-primary transition-colors text-xs sm:text-sm">
            {t.legal}
          </AppLink>
          <span className="text-gray-600">·</span>
          <AppLink to="/terms" className="hover:text-primary transition-colors text-xs sm:text-sm">
            {t.terms}
          </AppLink>
          <span className="text-gray-600">·</span>
          <AppLink to="/privacy" className="hover:text-primary transition-colors text-xs sm:text-sm">
            {t.privacy}
          </AppLink>
          <span className="text-gray-600">·</span>
          <AppLink to="/cookies" className="hover:text-primary transition-colors text-xs sm:text-sm">
            {t.cookies}
          </AppLink>
          <span className="text-gray-600">·</span>
          <AppLink to="/refund" className="hover:text-primary transition-colors text-xs sm:text-sm">
            {t.refundPolicy}
          </AppLink>
        </div>
      </div>
    </footer>
  );
};
