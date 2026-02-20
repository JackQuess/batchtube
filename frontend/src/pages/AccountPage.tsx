import React, { useEffect, useMemo, useState } from 'react';
import { AppLink, navigate } from '../lib/simpleRouter';
import { AuthUser, Translations } from '../types';
import { subscriptionAPI } from '../services/subscriptionAPI';
import { accountAPI, AccountSummary } from '../services/accountAPI';

interface AccountPageProps {
  t: Translations;
  user: AuthUser;
}

const DEFAULT_SUMMARY: AccountSummary = {
  plan: 'free',
  subscriptionStatus: 'inactive',
  renewalDate: null,
  cancelAtPeriodEnd: false,
  usage: {
    month: '',
    batchesCount: 0,
    itemsCount: 0,
    maxPerBatch: 3
  }
};

export const AccountPage: React.FC<AccountPageProps> = ({ t, user }) => {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<AccountSummary>(DEFAULT_SUMMARY);
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    let mounted = true;
    accountAPI
      .getSummary()
      .then((data) => {
        if (!mounted) return;
        setSummary(data);
      })
      .catch(() => {
        if (!mounted) return;
        setSummary(DEFAULT_SUMMARY);
      })
      .finally(() => {
        if (mounted) setLoadingSummary(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const isPro = summary.plan === 'pro';
  const renewalDateText = useMemo(() => {
    if (!summary.renewalDate) return '-';
    const date = new Date(summary.renewalDate);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString();
  }, [summary.renewalDate]);

  const handleUpgrade = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const url = await subscriptionAPI.createCheckout();
      if (url) {
        window.location.href = url;
        return;
      }
      setMessage(t.checkoutUnavailable);
    } catch {
      setMessage(t.checkoutUnavailable);
    } finally {
      setBusy(false);
    }
  };

  const handleManage = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const url = await subscriptionAPI.createPortal();
      if (url) {
        window.location.href = url;
        return;
      }
      setMessage(t.manageSubscriptionSoon);
    } catch {
      setMessage(t.manageSubscriptionSoon);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6">
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black/20">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.accountTitle}</h1>
        <p className="mt-2 text-sm text-neutral-300">{t.accountSubtitle}</p>

        <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-neutral-400">{t.emailLabel}</span>
            <span className="text-neutral-200 break-all">{user.email}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-neutral-400">{t.currentPlanLabel}</span>
            <span className={`text-xs px-2.5 py-1 rounded-full border ${isPro ? 'border-primary/50 text-primary' : 'border-white/20 text-neutral-200'}`}>
              {isPro ? t.planProLabel : t.planFreeLabel}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-neutral-400">{t.renewalDateLabel}</span>
            <span className="text-neutral-200">{renewalDateText}</span>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
          <h2 className="text-sm font-semibold text-neutral-200">{t.usageThisMonth}</h2>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
              <div className="text-neutral-400">{t.batchesRun}</div>
              <div className="mt-1 text-neutral-100 text-sm font-semibold">{loadingSummary ? '...' : summary.usage.batchesCount}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
              <div className="text-neutral-400">{t.itemsDownloaded}</div>
              <div className="mt-1 text-neutral-100 text-sm font-semibold">{loadingSummary ? '...' : summary.usage.itemsCount}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
              <div className="text-neutral-400">{t.maxPerBatchLabel}</div>
              <div className="mt-1 text-neutral-100 text-sm font-semibold">{loadingSummary ? '...' : summary.usage.maxPerBatch}</div>
            </div>
          </div>
        </div>

        {message && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-neutral-300">
            {message}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {!isPro ? (
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={busy}
              className="px-4 py-2 rounded-full bg-primary hover:bg-red-600 transition-colors text-sm font-semibold disabled:opacity-60"
            >
              {busy ? t.preparing : t.upgradeNow}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleManage}
              disabled={busy}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-sm"
            >
              {t.manageSubscription}
            </button>
          )}

          <AppLink
            to="/pricing"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-sm"
          >
            {t.pricing}
          </AppLink>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-sm"
          >
            {t.backToSearch}
          </button>
        </div>
      </div>
    </div>
  );
};
