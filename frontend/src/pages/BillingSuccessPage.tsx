import React from 'react';
import { AppLink } from '../lib/simpleRouter';
import { Translations } from '../types';

interface BillingSuccessPageProps {
  t: Translations;
}

export const BillingSuccessPage: React.FC<BillingSuccessPageProps> = ({ t }) => {
  return (
    <div className="max-w-2xl mx-auto w-full px-4 sm:px-6">
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black/20">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-300">{t.billingSuccessTitle}</h1>
        <p className="mt-2 text-sm text-neutral-300">{t.billingSuccessBody}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <AppLink to="/account" className="px-4 py-2 rounded-full bg-primary hover:bg-red-600 transition-colors text-sm font-semibold">
            {t.account}
          </AppLink>
          <AppLink to="/" className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-sm">
            {t.backToSearch}
          </AppLink>
        </div>
      </div>
    </div>
  );
};
