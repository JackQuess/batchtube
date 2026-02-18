import React from 'react';
import { AppLink, navigate } from '../lib/simpleRouter';
import { AuthUser, Translations } from '../types';
import { subscriptionAPI } from '../services/subscriptionAPI';

interface PricingPageProps {
  t: Translations;
  user: AuthUser | null;
}

interface Row {
  label: string;
  free: string;
  pro: string;
}

export const PricingPage: React.FC<PricingPageProps> = ({ t, user }) => {
  const rows: Row[] = [
    { label: t.pricingRowProviders, free: t.pricingFreeProviders, pro: t.pricingProProviders },
    { label: t.pricingRowVideosPerBatch, free: '3', pro: '50' },
    { label: t.pricingRowMaxQuality, free: '720p', pro: '1080p+ / 4K' },
    { label: t.pricingRowQueue, free: t.pricingFreeQueue, pro: t.pricingProQueue },
    { label: t.pricingRowZipSpeed, free: t.pricingFreeZip, pro: t.pricingProZip },
    { label: t.pricingRowAds, free: t.adsEnabled, pro: t.noAds },
    { label: t.pricingRowRetry, free: '-', pro: t.retrySupport },
    { label: t.pricingRowDailyLimits, free: t.pricingFreeDaily, pro: t.pricingProDaily },
    { label: t.pricingRowCommercialNotice, free: t.pricingCommercialNotice, pro: t.pricingCommercialNotice }
  ];

  const startPro = async () => {
    if (!user) {
      navigate('/signup?returnUrl=/pricing');
      return;
    }

    try {
      const url = await subscriptionAPI.createCheckout('/billing/success');
      if (url) {
        window.location.href = url;
        return;
      }
      navigate('/account');
    } catch {
      navigate('/account');
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6">
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black/20">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.chooseYourPlanTitle}</h1>
        <p className="mt-2 text-sm text-neutral-300">{t.chooseYourPlanSubtitle}</p>

        <div className="mt-6 rounded-xl border border-white/10 bg-black/20 overflow-hidden">
          <div className="grid grid-cols-3 bg-white/[0.03] border-b border-white/10 text-sm font-semibold">
            <div className="px-4 py-3">{t.pricingComparisonTitle}</div>
            <div className="px-4 py-3 text-center">{t.freePlan}</div>
            <div className="px-4 py-3 text-center text-primary">{t.proPlan}</div>
          </div>

          {rows.map((row) => (
            <div key={row.label} className="grid grid-cols-3 border-b border-white/5 last:border-b-0 text-xs sm:text-sm">
              <div className="px-4 py-3 text-neutral-300">{row.label}</div>
              <div className="px-4 py-3 text-center text-neutral-300">{row.free}</div>
              <div className="px-4 py-3 text-center text-neutral-100">{row.pro}</div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-neutral-200">{t.getStartedFlowTitle}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {[t.stepCreateAccount, t.stepPasteLinks, t.stepSelect, t.stepDownloadZip].map((step, idx) => (
              <div key={step} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-neutral-300">
                {idx + 1}. {step}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <AppLink
            to="/signup?returnUrl=/pricing"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-sm font-semibold"
          >
            {t.getStarted}
          </AppLink>
          <button
            type="button"
            onClick={startPro}
            className="px-4 py-2 rounded-full bg-primary hover:bg-red-600 transition-colors text-sm font-semibold"
          >
            {t.startPro}
          </button>
        </div>
      </div>
    </div>
  );
};
