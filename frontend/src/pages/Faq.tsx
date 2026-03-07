import React, { useEffect, useMemo } from 'react';
import { AppLink } from '../lib/simpleRouter';
import { applySeoMeta } from '../lib/seo';
import { INFO_TEXTS } from '../constants';
import { FAQ_ITEMS } from '../content/faq';
import { SupportedLanguage, Translations } from '../types';

interface FaqProps {
  lang: SupportedLanguage;
  t: Translations;
}

export const Faq: React.FC<FaqProps> = ({ lang, t }) => {
  const content = INFO_TEXTS[lang]?.faq || INFO_TEXTS.en.faq;
  const description = useMemo(() => content.replace(/\n+/g, ' ').trim(), [content]);

  useEffect(() => {
    applySeoMeta({
      title: `${t.faq} | BatchTube`,
      description
    });
  }, [description, t.faq]);

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6">
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black/20">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.faq}</h1>

        <div className="mt-6 space-y-3">
          {FAQ_ITEMS.map((item, idx) => (
            <div key={idx} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="font-semibold text-neutral-200 mb-2">{item.q}</p>
              <p className="text-sm text-neutral-400 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
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
            to="/supported-sites"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-sm"
          >
            {t.supportedSites}
          </AppLink>
        </div>
      </div>
    </div>
  );
};
