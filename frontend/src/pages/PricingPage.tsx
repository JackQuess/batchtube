import React, { useMemo, useState } from 'react';
import { AppLink, navigate } from '../lib/simpleRouter';
import { AuthUser, Translations } from '../types';
import { subscriptionAPI } from '../services/subscriptionAPI';

interface PricingPageProps {
  t: Translations;
  user: AuthUser | null;
}

export const PricingPage: React.FC<PricingPageProps> = ({ t, user }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const freeFeatures = useMemo(
    () => [
      `3 ${t.upToVideosPerBatch}`,
      `720p ${t.maxQuality}`,
      t.adsEnabled,
      t.limitedDailyUsage,
      t.standardQueue
    ],
    [t]
  );

  const proFeatures = useMemo(
    () => [
      `50 ${t.upToVideosPerBatch}`,
      '1080p+',
      t.noAds,
      t.priorityQueue,
      t.fasterZip,
      t.retrySupport
    ],
    [t]
  );

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/login?returnUrl=/pricing');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const url = await subscriptionAPI.createCheckout('/account');
      if (url) {
        window.location.href = url;
        return;
      }
      navigate('/account');
    } catch {
      setError(t.checkoutUnavailable);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6">
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black/20">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.plansTitle}</h1>
        <p className="mt-2 text-sm text-neutral-300">{t.pricingSubtitle}</p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <article className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-sm font-semibold text-white">{t.freePlan.toUpperCase()}</div>
            <ul className="mt-3 space-y-1.5 text-xs text-neutral-300">
              {freeFeatures.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
          </article>

          <article className="rounded-xl border border-primary/40 bg-black/20 p-4 relative">
            <div className="pointer-events-none absolute -inset-1 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 blur-lg" />
            <div className="relative">
              <div className="text-sm font-semibold text-white">{`${t.proPlan.toUpperCase()} ($9${t.monthlyPrice})`}</div>
              <ul className="mt-3 space-y-1.5 text-xs text-neutral-300">
                {proFeatures.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
            </div>
          </article>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={handleUpgrade}
            className="px-4 py-2 rounded-full bg-primary hover:bg-red-600 transition-colors text-sm font-semibold disabled:opacity-60"
          >
            {busy ? t.preparing : t.upgradeNow}
          </button>
          <AppLink
            to="/"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-sm"
          >
            {t.backToSearch}
          </AppLink>
        </div>
      </div>
    </div>
  );
};
