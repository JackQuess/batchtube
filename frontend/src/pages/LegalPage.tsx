import React, { useEffect, useMemo } from 'react';
import { AppLink } from '../lib/simpleRouter';
import { applySeoMeta } from '../lib/seo';
import { LEGAL_TEXTS } from '../constants';
import { LegalDocType, SupportedLanguage, Translations } from '../types';

interface LegalPageProps {
  type: LegalDocType;
  lang: SupportedLanguage;
  t: Translations;
}

export const LegalPage: React.FC<LegalPageProps> = ({ type, lang, t }) => {
  const titleMap: Record<LegalDocType, string> = {
    legal: t.legal,
    terms: t.terms,
    privacy: t.privacy,
    cookies: t.cookies,
    refund: t.refundPolicy
  };

  const content = LEGAL_TEXTS[lang]?.[type] || LEGAL_TEXTS.en[type];
  const title = titleMap[type] || t.legal;
  const description = useMemo(() => content.replace(/\n+/g, ' ').trim(), [content]);

  useEffect(() => {
    applySeoMeta({
      title: `${title} | BatchTube`,
      description
    });
  }, [description, title]);

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6">
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black/20">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
          <pre className="whitespace-pre-wrap text-sm text-neutral-300 leading-relaxed font-sans">
            {content}
          </pre>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <AppLink
            to="/"
            className="px-4 py-2 rounded-full bg-primary hover:bg-red-600 transition-colors text-sm font-semibold"
          >
            {t.backToSearch}
          </AppLink>
          <AppLink to="/privacy" className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-sm">
            {t.privacy}
          </AppLink>
          <AppLink to="/terms" className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-sm">
            {t.terms}
          </AppLink>
          <AppLink to="/cookies" className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-sm">
            {t.cookies}
          </AppLink>
          <AppLink to="/refund" className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-sm">
            {t.refundPolicy}
          </AppLink>
        </div>
      </div>
    </div>
  );
};
