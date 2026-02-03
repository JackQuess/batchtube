import React, { useEffect, useMemo } from 'react';
import { AppLink } from '../lib/simpleRouter';
import { applySeoMeta } from '../lib/seo';
import { INFO_TEXTS } from '../constants';
import { SupportedLanguage, Translations } from '../types';

interface SupportedSitesProps {
  lang: SupportedLanguage;
  t: Translations;
}

export const SupportedSites: React.FC<SupportedSitesProps> = ({ lang, t }) => {
  const content = INFO_TEXTS[lang]?.supportedSites || INFO_TEXTS.en.supportedSites;
  const description = useMemo(() => content.replace(/\n+/g, ' ').trim(), [content]);

  useEffect(() => {
    applySeoMeta({
      title: `${t.supportedSites} | BatchTube`,
      description
    });
  }, [description, t.supportedSites]);

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6">
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black/20">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.supportedSites}</h1>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="whitespace-pre-line text-sm text-neutral-300 leading-relaxed">{content}</div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <AppLink
            to="/"
            className="px-4 py-2 rounded-full bg-primary hover:bg-red-600 transition-colors text-sm font-semibold"
          >
            {t.backToSearch}
          </AppLink>
          <AppLink
            to="/how-it-works"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-sm"
          >
            {t.howItWorks}
          </AppLink>
          <AppLink
            to="/faq"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-sm"
          >
            {t.faq}
          </AppLink>
        </div>
      </div>
    </div>
  );
};
