import React from 'react';
import { ViewState } from '../types';
import { Button } from '../components/Button';
import { GlassInput } from '../components/GlassInput';

interface SettingsScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Configure defaults for every new batch.</p>
      </div>

      <section className="glass-card rounded-2xl p-6 border border-white/10">
        <h2 className="text-lg font-semibold text-white mb-5">Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <GlassInput label="Full Name" defaultValue="John Doe" />
          <GlassInput label="Email Address" defaultValue="john@example.com" />
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6 border border-white/10">
        <h2 className="text-lg font-semibold text-white mb-5">Default processing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Default Format</label>
            <select className="w-full input-glass rounded-lg text-white text-sm p-3 focus:outline-none">
              <option>MP4</option>
              <option>MP3</option>
              <option>MKV</option>
            </select>
          </div>
          <GlassInput label="Filename Template" defaultValue="{title}_{date}" />
        </div>

        <div className="mt-6 space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Auto-archive as ZIP</span>
            <input type="checkbox" defaultChecked className="accent-primary" />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Enable retry on failed items</span>
            <input type="checkbox" defaultChecked className="accent-primary" />
          </label>
        </div>
      </section>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => onNavigate('account')}>Go to Account</Button>
        <Button className="px-8">Save Settings</Button>
      </div>
    </div>
  );
};
