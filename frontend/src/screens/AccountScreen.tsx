import React from 'react';
import { ViewState } from '../types';
import { Button } from '../components/Button';
import { GlassInput } from '../components/GlassInput';

interface AccountScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white">Account</h1>
        <p className="text-sm text-gray-400 mt-1">Manage identity, plan, and security preferences.</p>
      </div>

      <section className="glass-card rounded-2xl p-6 border border-white/10">
        <h2 className="text-lg font-semibold text-white mb-5">Profile information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <GlassInput label="Full Name" defaultValue="John Doe" />
          <GlassInput label="Email Address" defaultValue="john@example.com" />
          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wider text-gray-500">Member Since</label>
            <div className="input-glass rounded-lg h-12 px-4 flex items-center text-sm text-gray-400">October 24, 2023</div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button className="h-10 px-6">Save Changes</Button>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Current plan</p>
          <p className="text-xl font-semibold text-white mt-1">Pro Plan</p>
          <p className="text-sm text-gray-500">Renews on Nov 24, 2026</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => onNavigate('billing')}>Billing</Button>
          <Button onClick={() => onNavigate('pricing')}>Upgrade</Button>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 border border-red-500/20">
        <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
        <p className="text-sm text-gray-400 mt-1">Delete your account and all associated data permanently.</p>
        <button className="mt-4 px-4 py-2 border border-red-500/40 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors">Delete Account</button>
      </section>
    </div>
  );
};
