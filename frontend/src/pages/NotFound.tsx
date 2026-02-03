import React, { useEffect } from 'react';
import { AppLink } from '../lib/simpleRouter';
import { applySeoMeta } from '../lib/seo';
import { Translations } from '../types';

interface NotFoundProps {
  t: Translations;
}

export const NotFound: React.FC<NotFoundProps> = ({ t }) => {
  useEffect(() => {
    applySeoMeta({
      title: `404 | ${t.notFoundTitle}`,
      description: t.notFoundBody
    });
  }, [t.notFoundBody, t.notFoundTitle]);

  return (
    <div className="max-w-2xl mx-auto w-full px-4 sm:px-6">
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black/20 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.notFoundTitle}</h1>
        <p className="mt-3 text-neutral-300 leading-relaxed">
          {t.notFoundBody}
        </p>
        <div className="mt-6">
          <AppLink
            to="/"
            className="inline-flex px-4 py-2 rounded-full bg-primary hover:bg-red-600 transition-colors text-sm font-semibold"
          >
            {t.backToSearch}
          </AppLink>
        </div>
      </div>
    </div>
  );
};
