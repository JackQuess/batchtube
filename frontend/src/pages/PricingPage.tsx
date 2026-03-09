import React from 'react';
import { AppLink, navigate } from '../lib/simpleRouter';
import { AuthUser, Translations } from '../types';
import { subscriptionAPI } from '../services/subscriptionAPI';
import { LEMON_CHECKOUT_PRO } from '../constants';
import { Check, X } from 'lucide-react';

interface PricingPageProps {
  t: Translations;
  user: AuthUser | null;
  onUpgrade?: () => void;
}

interface Row {
  label: string;
  free: string;
  pro: string;
}

export const PricingPage: React.FC<PricingPageProps> = ({ t, user, onUpgrade }) => {
  const rows: Row[] = [
    { label: t.pricingRowProviders, free: t.pricingFreeProviders, pro: t.pricingProProviders },
    { label: t.pricingRowVideosPerBatch, free: '20', pro: '200' },
    { label: t.pricingRowMaxQuality, free: '1080p', pro: '1080p' },
    { label: t.pricingRowQueue, free: t.pricingFreeQueue, pro: t.pricingProQueue },
    { label: t.pricingRowZipSpeed, free: t.pricingFreeZip, pro: t.pricingProZip },
    { label: t.pricingRowAds, free: t.adsEnabled, pro: t.noAds },
    { label: t.pricingRowRetry, free: '-', pro: t.retrySupport },
    { label: t.pricingRowDailyLimits, free: t.pricingFreeDaily, pro: t.pricingProDaily },
    { label: t.pricingRowCommercialNotice, free: t.pricingCommercialNotice, pro: t.pricingCommercialNotice }
  ];

  const startPro = async () => {
    if (LEMON_CHECKOUT_PRO) {
      window.location.href = LEMON_CHECKOUT_PRO;
      return;
    }
    if (!user) {
      onUpgrade?.();
      return;
    }
    try {
      const url = await subscriptionAPI.createCheckout();
      if (url) {
        window.location.href = url;
        return;
      }
      navigate('/account');
    } catch {
      navigate('/account');
    }
  };

  // Public pricing (batchtube 8 exact)
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Simple, transparent pricing</h1>
          <p className="text-xl text-app-muted max-w-2xl mx-auto">
            Choose the plan that fits your workflow. No hidden fees, cancel anytime.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-panel p-8 rounded-2xl border border-white/10 relative">
            <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-bold text-white">$0</span>
              <span className="text-app-muted">/month</span>
            </div>
            <p className="text-sm text-app-muted mb-8">Perfect for occasional downloads and personal use.</p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-sm text-white">
                <Check className="w-5 h-5 text-green-400 shrink-0" /> 100 videos monthly
              </li>
              <li className="flex items-center gap-3 text-sm text-white">
                <Check className="w-5 h-5 text-green-400 shrink-0" /> Max 20 links per batch
              </li>
              <li className="flex items-center gap-3 text-sm text-white">
                <Check className="w-5 h-5 text-green-400 shrink-0" /> Up to 1080p quality
              </li>
              <li className="flex items-center gap-3 text-sm text-app-muted/50">
                <X className="w-5 h-5 shrink-0" /> No CLI / API
              </li>
              <li className="flex items-center gap-3 text-sm text-app-muted/50">
                <X className="w-5 h-5 shrink-0" /> No automation / webhooks
              </li>
            </ul>
            <button
              type="button"
              onClick={onUpgrade}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-white/10"
            >
              Get Started for Free
            </button>
          </div>
          <div className="glass-panel p-8 rounded-2xl border border-app-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-app-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              MOST POPULAR
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-app-primary/10 to-transparent pointer-events-none" />
            <h3 className="text-2xl font-bold text-white mb-2 relative">Pro</h3>
            <div className="flex items-baseline gap-2 mb-6 relative">
              <span className="text-4xl font-bold text-white">$20</span>
              <span className="text-app-muted">/month</span>
            </div>
            <p className="text-sm text-app-muted mb-8 relative">For power users who need higher limits and speed.</p>
            <ul className="space-y-4 mb-8 relative">
              <li className="flex items-center gap-3 text-sm text-white">
                <Check className="w-5 h-5 text-app-primary shrink-0" /> 1000 videos monthly
              </li>
              <li className="flex items-center gap-3 text-sm text-white">
                <Check className="w-5 h-5 text-app-primary shrink-0" /> Large batch downloads
              </li>
              <li className="flex items-center gap-3 text-sm text-white">
                <Check className="w-5 h-5 text-app-primary shrink-0" /> CLI access & channel archive
              </li>
              <li className="flex items-center gap-3 text-sm text-app-muted/50">
                <X className="w-5 h-5 shrink-0" /> No API access
              </li>
              <li className="flex items-center gap-3 text-sm text-app-muted/50">
                <X className="w-5 h-5 shrink-0" /> No automation / webhooks
              </li>
            </ul>
            <button
              type="button"
              onClick={startPro}
              className="w-full py-3 rounded-xl bg-app-primary hover:bg-red-700 text-white font-medium transition-colors shadow-[0_0_20px_rgba(165,0,52,0.4)] relative"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    );
  }

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
