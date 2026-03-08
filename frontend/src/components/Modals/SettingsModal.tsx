import React from 'react';
import { ModalType } from '../../types';
import { User, CreditCard, Folder, History, Globe, Code, LogOut, ChevronRight, Settings2 } from 'lucide-react';

interface SettingsModalProps {
  onNavigate: (modal: ModalType) => void;
  onLogout: () => void;
}

export function SettingsModal({ onNavigate, onLogout }: SettingsModalProps) {
  const mainItems = [
    { id: 'profile' as const, label: 'Profile', description: 'Account & preferences', icon: User, action: () => onNavigate('profile') },
    { id: 'pricing' as const, label: 'Plan & Billing', description: 'Credits and subscription', icon: CreditCard, action: () => onNavigate('pricing') },
    { id: 'files' as const, label: 'Files', description: 'Downloaded media', icon: Folder, action: () => onNavigate('files') },
    { id: 'history' as const, label: 'History', description: 'Recent batches', icon: History, action: () => onNavigate('history') },
  ];

  const secondaryItems = [
    { id: 'supportedSites' as const, label: 'Supported Sites', description: 'Platforms we support', icon: Globe, action: () => onNavigate('supportedSites') },
    { id: 'api' as const, label: 'API & Webhooks', description: 'Studio plan only', icon: Code, action: () => onNavigate('api') },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-1 pb-4 mb-4 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-app-primary/10 border border-app-primary/20 flex items-center justify-center">
          <Settings2 className="w-5 h-5 text-app-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Settings</h2>
          <p className="text-xs text-app-muted">Manage your account and preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="text-[10px] font-semibold text-app-muted/70 uppercase tracking-widest px-3 mb-2">Account</h3>
          <div className="flex flex-col gap-0.5 rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
            {mainItems.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/5 active:bg-white/10 transition-colors group text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-app-primary/10 group-hover:border-app-primary/20 transition-colors shrink-0">
                  <item.icon className="w-4 h-4 text-app-muted group-hover:text-app-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white block">{item.label}</span>
                  <span className="text-xs text-app-muted block truncate">{item.description}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-app-muted/40 group-hover:text-app-muted group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-semibold text-app-muted/70 uppercase tracking-widest px-3 mb-2">Developer</h3>
          <div className="flex flex-col gap-0.5 rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
            {secondaryItems.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/5 active:bg-white/10 transition-colors group text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-app-primary/10 group-hover:border-app-primary/20 transition-colors shrink-0">
                  <item.icon className="w-4 h-4 text-app-muted group-hover:text-app-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white block">{item.label}</span>
                  <span className="text-xs text-app-muted block truncate">{item.description}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-app-muted/40 group-hover:text-app-muted group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-auto pt-6 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors group"
        >
          <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Log out</span>
        </button>
      </div>
    </div>
  );
}
