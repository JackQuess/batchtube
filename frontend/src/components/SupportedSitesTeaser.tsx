import React from 'react';
import { Translations } from '../types';
import { AppLink } from '../lib/simpleRouter';

interface SupportedSitesTeaserProps {
  t: Translations;
  upgradeHref: string;
}

const TEASER_ITEMS = ['YouTube', 'TikTok', 'Instagram', 'Vimeo', 'Reddit', 'SoundCloud', 'Direct'];

export const SupportedSitesTeaser: React.FC<SupportedSitesTeaserProps> = ({ t, upgradeHref }) => {
  return (
    <section className="mt-4 sm:mt-5 animate-fadeIn">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-neutral-200">{t.supportedSitesTeaserTitle}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {TEASER_ITEMS.map((item) => (
                <span key={item} className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 bg-black/20 text-neutral-300">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5 lg:justify-end">
            <AppLink to="/supported-sites" className="text-xs text-primary hover:text-red-300 transition-colors">
              {t.viewAllSupportedSites}
            </AppLink>
            <span className="text-neutral-600 text-xs hidden sm:inline">•</span>
            <AppLink
              to="/pricing"
              className="px-3 py-1.5 rounded-full border border-white/10 bg-black/20 hover:border-white/20 text-xs text-neutral-200 transition-colors"
            >
              {t.seePricing}
            </AppLink>
            <AppLink
              to={upgradeHref}
              className="px-3 py-1.5 rounded-full bg-primary hover:bg-red-600 text-xs text-white font-semibold transition-colors"
            >
              {t.upgrade}
            </AppLink>
          </div>
        </div>
      </div>
    </section>
  );
};
