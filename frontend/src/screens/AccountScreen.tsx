import React, { useEffect, useState } from 'react';
import { ViewState } from '../types';
import { Button } from '../components/Button';
import { accountAPI, AccountSummary } from '../services/accountAPI';
import { getStoredUser } from '../lib/auth';

interface AccountScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({ onNavigate }) => {
  const user = getStoredUser();
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);

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

    void load();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h1 className="text-2xl font-bold text-white">Account Settings</h1>

      <div className="glass-card rounded-xl p-6 md:p-8">
        <h2 className="text-lg font-semibold text-white mb-6">Profile Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5 w-full">
            <label className="block text-xs font-medium uppercase tracking-wider text-gray-500">User ID</label>
            <div className="input-glass rounded-lg flex items-center px-4 h-12 text-sm text-gray-300">{user?.id || '-'}</div>
          </div>
          <div className="space-y-1.5 w-full">
            <label className="block text-xs font-medium uppercase tracking-wider text-gray-500">Email Address</label>
            <div className="input-glass rounded-lg flex items-center px-4 h-12 text-sm text-gray-300">{user?.email || '-'}</div>
          </div>
          <div className="space-y-1.5 w-full">
            <label className="block text-xs font-medium uppercase tracking-wider text-gray-500">Plan</label>
            <div className="input-glass rounded-lg flex items-center px-4 h-12 text-sm text-gray-300 uppercase">{summary?.plan || 'free'}</div>
          </div>
          <div className="space-y-1.5 w-full">
            <label className="block text-xs font-medium uppercase tracking-wider text-gray-500">Reset Date</label>
            <div className="input-glass rounded-lg flex items-center px-4 h-12 text-sm text-gray-300">
              {summary?.renewalDate ? new Date(summary.renewalDate).toLocaleDateString() : '-'}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white mb-1">Credit Usage</h2>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading usage...</p>
          ) : (
            <div className="text-sm text-gray-300 space-y-1">
              <p>Used: {summary?.credits.used ?? 0}</p>
              <p>Limit: {summary?.credits.limit ?? 0}</p>
              <p>Available: {summary?.credits.available ?? 0}</p>
            </div>
          )}
        </div>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={() => onNavigate('billing')}>
            Billing
          </Button>
        </div>
      </div>
    </div>
  );
};
