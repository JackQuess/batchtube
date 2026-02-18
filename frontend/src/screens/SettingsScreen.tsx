import React from 'react';
import { ViewState } from '../types';
import { Button } from '../components/Button';
import { GlassInput } from '../components/GlassInput';

interface SettingsScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      <h1 className="text-2xl font-bold text-white">Account Settings</h1>

      {/* Profile Section */}
      <div className="glass-card rounded-xl p-6 md:p-8">
        <h2 className="text-lg font-semibold text-white mb-6">Profile Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassInput label="Full Name" defaultValue="John Doe" />
          <GlassInput label="Email Address" defaultValue="john@example.com" />
        </div>
        <div className="mt-6 flex justify-end">
           <Button className="w-auto px-6 h-10">Save Changes</Button>
        </div>
      </div>

      {/* Defaults Section */}
      <div className="glass-card rounded-xl p-6 md:p-8">
        <h2 className="text-lg font-semibold text-white mb-6">Processing Defaults</h2>
        <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Default Format</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg text-white text-sm p-3 focus:border-primary focus:outline-none input-glass">
                    <option>MP4 (Video)</option>
                    <option>MP3 (Audio)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Filename Template</label>
                <input type="text" defaultValue="{title}_{date}" className="w-full bg-transparent border border-white/10 rounded-lg text-white text-sm p-3 focus:border-primary focus:outline-none input-glass" />
              </div>
           </div>

           <div className="border-t border-white/5 pt-6">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                   <h4 className="text-sm font-medium text-white">Auto-Archive to ZIP</h4>
                   <p className="text-xs text-gray-500">Automatically zip batches larger than 5 files.</p>
                </div>
                <div className="relative">
                   <input type="checkbox" className="peer sr-only" defaultChecked />
                   <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </div>
              </label>
           </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card rounded-xl p-6 md:p-8 border border-red-500/20">
         <h2 className="text-lg font-semibold text-red-500 mb-2">Danger Zone</h2>
         <p className="text-sm text-gray-400 mb-6">Once you delete your account, there is no going back. Please be certain.</p>
         <button className="px-4 py-2 border border-red-500/50 text-red-500 text-sm font-medium rounded-lg hover:bg-red-500/10 transition-colors">
            Delete Account
         </button>
      </div>
    </div>
  );
};