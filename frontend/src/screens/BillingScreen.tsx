import React, { useEffect, useState } from 'react';
import { ViewState } from '../types';
import { Button } from '../components/Button';
import { accountAPI, AccountSummary } from '../services/accountAPI';
import { subscriptionAPI } from '../services/subscriptionAPI';

interface BillingScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const BillingScreen: React.FC<BillingScreenProps> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await accountAPI.getSummary();
        setSummary(data);
      } catch {
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleUpgrade = async () => {
    try {
      setError(null);
      const url = await subscriptionAPI.createCheckout(window.location.href);
      if (url) {
        window.location.href = url;
        return;
      }
      setError('Checkout URL alınamadı.');
    } catch (err: any) {
      setError(err?.message || 'Upgrade başlatılamadı.');
    }
  };

  const handleManage = async () => {
    try {
      setError(null);
      const url = await subscriptionAPI.createPortal(window.location.href);
      if (url) {
        window.location.href = url;
        return;
      }
      setError('Portal URL alınamadı.');
    } catch (err: any) {
      setError(err?.message || 'Portal açılamadı.');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h1 className="text-2xl font-bold text-white">Subscription</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="glass-card p-8 rounded-xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">Current Plan</p>
              <h2 className="text-3xl font-bold text-white mb-2">{loading ? 'Loading...' : (summary?.plan || 'free').toUpperCase()}</h2>
              <p className="text-sm text-gray-400 mb-8">
                Renewal: {summary?.renewalDate ? new Date(summary.renewalDate).toLocaleString() : 'N/A'}
              </p>

              <div className="flex flex-wrap gap-4">
                <Button className="w-auto px-6" onClick={handleUpgrade}>
                  Upgrade to Pro
                </Button>
                <button onClick={handleManage} className="px-6 py-2 border border-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/10 transition-colors h-12">
                  Manage Subscription
                </button>
                <Button variant="secondary" className="w-auto px-6" onClick={() => onNavigate('account')}>
                  Account
                </Button>
              </div>
              {error && <p className="text-xs text-red-400 mt-4">{error}</p>}
            </div>
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 bg-white/5">
              <h3 className="font-semibold text-white">Usage Snapshot</h3>
            </div>
            <div className="p-6 text-sm text-gray-300 space-y-2">
              <p>Month: {summary?.usage.month || '-'}</p>
              <p>Batches: {summary?.usage.batchesCount ?? 0}</p>
              <p>Items: {summary?.usage.itemsCount ?? 0}</p>
              <p>Max per batch: {summary?.usage.maxPerBatch ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-card p-6 rounded-xl">
            <h3 className="font-semibold text-white mb-4">Status</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Plan</span>
                <span className="text-white">{summary?.plan || 'free'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subscription</span>
                <span className="text-white">{summary?.subscriptionStatus || 'inactive'}</span>
              </div>
            </div>
            <Button variant="secondary" fullWidth className="text-xs" onClick={() => window.location.reload()}>
              Refresh Status
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
