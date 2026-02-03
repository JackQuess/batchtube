import React, { useEffect, useMemo } from 'react';
import { AppLink } from '../lib/simpleRouter';
import { applySeoMeta } from '../lib/seo';
import { INFO_TEXTS } from '../constants';
import { SupportedLanguage, Translations } from '../types';

interface HowItWorksProps {
  lang: SupportedLanguage;
  t: Translations;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ lang, t }) => {
  const content = INFO_TEXTS[lang]?.howItWorks || INFO_TEXTS.en.howItWorks;
  const description = useMemo(() => content.replace(/\n+/g, ' ').trim(), [content]);

  useEffect(() => {
    applySeoMeta({
      title: `${t.howItWorks} | BatchTube`,
      description
    });
  }, [description, t.howItWorks]);

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6">
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black/20">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.howItWorks}</h1>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="whitespace-pre-line text-sm text-neutral-300 leading-relaxed">{content}</div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <AppLink
            to="/faq"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-sm"
          >
            {t.faq}
          </AppLink>
          <AppLink
            to="/supported-sites"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-sm"
          >
            {t.supportedSites}
          </AppLink>
          <AppLink
            to="/"
            className="px-4 py-2 rounded-full bg-primary hover:bg-red-600 transition-colors text-sm font-semibold"
          >
            {t.backToSearch}
          </AppLink>
        </div>
      </div>
    </div>
  );
};
