import React, { useMemo, useState } from 'react';
import { ViewState } from '../types';
import { Button } from '../components/Button';
import { GlassInput } from '../components/GlassInput';
import { getStoredUser } from '../lib/auth';

interface SettingsScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate }) => {
  const user = getStoredUser();
  const storageKey = useMemo(
    () => `batchtube_settings_${user?.id || 'guest'}`,
    [user?.id]
  );

  const existingRaw = localStorage.getItem(storageKey);
  const existing = existingRaw
    ? (JSON.parse(existingRaw) as {
        fullName?: string;
        defaultFormat?: 'mp4' | 'mp3';
        filenameTemplate?: string;
        autoZip?: boolean;
      })
    : {};

  const [fullName, setFullName] = useState(existing.fullName || user?.email?.split('@')[0] || '');
  const [email] = useState(user?.email || '');
  const [defaultFormat, setDefaultFormat] = useState<'mp4' | 'mp3'>(existing.defaultFormat || 'mp4');
  const [filenameTemplate, setFilenameTemplate] = useState(existing.filenameTemplate || '{title}_{date}');
  const [autoZip, setAutoZip] = useState(existing.autoZip ?? true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        fullName,
        defaultFormat,
        filenameTemplate,
        autoZip,
        updatedAt: new Date().toISOString()
      })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      <h1 className="text-2xl font-bold text-white">Account Settings</h1>

      {/* Profile Section */}
      <div className="glass-card rounded-xl p-6 md:p-8">
        <h2 className="text-lg font-semibold text-white mb-6">Profile Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassInput label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <GlassInput label="Email Address" value={email} readOnly />
        </div>
        <div className="mt-6 flex justify-end">
          <div className="flex items-center gap-4">
            {saved && <span className="text-xs text-emerald-400">Saved</span>}
            <Button className="w-auto px-6 h-10" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Defaults Section */}
      <div className="glass-card rounded-xl p-6 md:p-8">
        <h2 className="text-lg font-semibold text-white mb-6">Processing Defaults</h2>
        <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Default Format</label>
                <select
                  value={defaultFormat}
                  onChange={(e) => setDefaultFormat(e.target.value as 'mp4' | 'mp3')}
                  className="w-full bg-white/5 border border-white/10 rounded-lg text-white text-sm p-3 focus:border-primary focus:outline-none input-glass"
                >
                    <option value="mp4">MP4 (Video)</option>
                    <option value="mp3">MP3 (Audio)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Filename Template</label>
                <input
                  type="text"
                  value={filenameTemplate}
                  onChange={(e) => setFilenameTemplate(e.target.value)}
                  className="w-full bg-transparent border border-white/10 rounded-lg text-white text-sm p-3 focus:border-primary focus:outline-none input-glass"
                />
              </div>
           </div>

           <div className="border-t border-white/5 pt-6">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                   <h4 className="text-sm font-medium text-white">Auto-Archive to ZIP</h4>
                   <p className="text-xs text-gray-500">Automatically zip batches larger than 5 files.</p>
                </div>
                <div className="relative">
                   <input
                     type="checkbox"
                     className="peer sr-only"
                     checked={autoZip}
                     onChange={(e) => setAutoZip(e.target.checked)}
                   />
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
