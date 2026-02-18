import React from 'react';
import { ViewState } from '../types';
import { Button } from '../components/Button';
import { GlassInput } from '../components/GlassInput';

interface AccountScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      <h1 className="text-2xl font-bold text-white">Account Settings</h1>

      {/* Profile Info */}
      <div className="glass-card rounded-xl p-6 md:p-8">
        <h2 className="text-lg font-semibold text-white mb-6">Profile Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassInput label="Full Name" defaultValue="John Doe" />
          <GlassInput label="Email Address" defaultValue="john@example.com" />
          <div className="space-y-1.5 w-full">
            <label className="block text-xs font-medium uppercase tracking-wider text-gray-500">
              Member Since
            </label>
            <div className="input-glass rounded-lg flex items-center px-4 h-12 text-sm text-gray-400 cursor-not-allowed">
              October 24, 2023
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
           <Button className="w-auto px-6 h-10">Save Changes</Button>
        </div>
      </div>

      {/* Current Plan */}
      <div className="glass-card rounded-xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="flex-1">
            <h2 className="text-lg font-semibold text-white mb-1">Current Plan</h2>
            <p className="text-gray-400 text-sm">You are currently on the <strong className="text-white">Pro Plan</strong>.</p>
            <p className="text-gray-500 text-xs mt-2">Renews on Nov 24, 2026</p>
         </div>
         <div className="flex gap-4">
            <Button variant="secondary" onClick={() => onNavigate('billing')}>Billing</Button>
         </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card rounded-xl p-6 md:p-8 border border-red-500/20">
         <div className="flex justify-between items-center">
            <div>
                <h2 className="text-lg font-semibold text-red-500 mb-1">Danger Zone</h2>
                <p className="text-sm text-gray-400">Irreversible actions for your account.</p>
            </div>
            <div className="flex gap-3">
                <button className="px-4 py-2 border border-red-500/30 text-red-500 text-sm font-medium rounded-lg hover:bg-red-500/10 transition-colors">
                  Delete Account
                </button>
            </div>
         </div>
      </div>
    </div>
  );
};