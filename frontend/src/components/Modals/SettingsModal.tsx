import React from 'react';
import { ModalType } from '../../types';
import { User, CreditCard, Folder, History, Globe, Code, LogOut, ChevronRight } from 'lucide-react';

interface SettingsModalProps {
  onNavigate: (modal: ModalType) => void;
  onLogout: () => void;
}

export function SettingsModal({ onNavigate, onLogout }: SettingsModalProps) {
  const menuItems = [
    { id: 'profile' as const, label: 'Profile', icon: User, action: () => onNavigate('profile') },
    { id: 'pricing' as const, label: 'Plan', icon: CreditCard, action: () => onNavigate('pricing') },
    { id: 'files' as const, label: 'Files', icon: Folder, action: () => onNavigate('files') },
    { id: 'history' as const, label: 'History', icon: History, action: () => onNavigate('history') },
    { id: 'supportedSites' as const, label: 'Supported Sites', icon: Globe, action: () => onNavigate('supportedSites') },
    { id: 'api' as const, label: 'API (Studio plan only)', icon: Code, action: () => onNavigate('api') },
  ];

  return (
    <div className="flex flex-col h-full p-2">
      <div className="flex flex-col gap-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={item.action}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center gap-3 text-app-muted group-hover:text-white transition-colors">
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-app-muted/50 group-hover:text-white/50 group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-app-border">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-red-500/70 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
