import React from 'react';
import { Translations } from '../types';
import { AppLink } from '../lib/simpleRouter';

interface SupportedSitesTeaserProps {
  t: Translations;
}

const TEASER_ITEMS = ['YouTube', 'TikTok', 'Instagram', 'Vimeo', 'Reddit', 'SoundCloud', 'Direct'];

export const SupportedSitesTeaser: React.FC<SupportedSitesTeaserProps> = ({ t }) => {
  return (
    <section className="mt-4 sm:mt-5 animate-fadeIn">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm font-semibold text-neutral-200">{t.supportedSitesTeaserTitle}</h2>
          <AppLink to="/supported-sites" className="text-xs text-primary hover:text-red-300 transition-colors">
            {t.viewAllSupportedSites}
          </AppLink>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {TEASER_ITEMS.map((item) => (
            <span key={item} className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 bg-black/20 text-neutral-300">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
