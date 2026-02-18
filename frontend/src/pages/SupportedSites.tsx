import React, { useEffect, useMemo, useState } from 'react';
import { AppLink } from '../lib/simpleRouter';
import { applySeoMeta } from '../lib/seo';
import { SupportedLanguage, Translations } from '../types';
import { PROVIDER_CATALOG, ProviderCategory } from '../providerCatalog';

interface SupportedSitesProps {
  lang: SupportedLanguage;
  t: Translations;
}

export const SupportedSites: React.FC<SupportedSitesProps> = ({ t }) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | ProviderCategory>('all');

  useEffect(() => {
    applySeoMeta({
      title: `${t.supportedPlatformsTitle} | BatchTube`,
      description: t.supportedPlatformsSubtitle
    });
  }, [t.supportedPlatformsSubtitle, t.supportedPlatformsTitle]);

  const categoryLabels: Record<ProviderCategory, string> = {
    video: t.categoryVideo,
    social: t.categorySocial,
    audio: t.categoryAudio,
    other: t.categoryOther,
    direct: t.categoryDirect
  };

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return PROVIDER_CATALOG.filter((provider) => {
      if (activeCategory !== 'all' && provider.category !== activeCategory) return false;
      if (!lower) return true;
      return provider.name.toLowerCase().includes(lower) || provider.id.toLowerCase().includes(lower);
    });
  }, [activeCategory, query]);

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6">
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black/20">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.supportedPlatformsTitle}</h1>
        <p className="mt-2 text-sm text-neutral-300">{t.supportedPlatformsSubtitle}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${activeCategory === 'all' ? 'border-primary text-primary' : 'border-white/10 text-neutral-300 hover:border-white/20'}`}
          >
            {t.providersAllCategory}
          </button>
          {(Object.keys(categoryLabels) as ProviderCategory[]).map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${activeCategory === category ? 'border-primary text-primary' : 'border-white/10 text-neutral-300 hover:border-white/20'}`}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.providersSearchPlaceholder}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-primary"
          />
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((provider) => (
            <div key={provider.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-neutral-100 font-medium">{provider.name}</div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${provider.tier === 'pro' ? 'border-primary/50 text-primary' : 'border-white/20 text-neutral-300'}`}>
                  {provider.tier === 'pro' ? t.proBadge : t.freeBadge}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-neutral-500 uppercase tracking-wide">{categoryLabels[provider.category]}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-300">
          <div className="font-semibold text-neutral-200">{t.freePlanIncludesTitle}</div>
          <div className="mt-2">{t.freePlanIncludesBody}</div>
          <div className="mt-2 text-neutral-400">{t.proUnlocksAllProvidersNote}</div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <AppLink to="/" className="px-4 py-2 rounded-full bg-primary hover:bg-red-600 transition-colors text-sm font-semibold">
            {t.backToSearch}
          </AppLink>
          <AppLink to="/pricing" className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-sm">
            {t.pricing}
          </AppLink>
        </div>
      </div>
    </div>
  );
};
