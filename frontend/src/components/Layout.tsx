import React, { useState } from 'react';
import { Logo } from './Logo';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewState;
  onNavigate: (view: ViewState) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const appViews: ViewState[] = ['dashboard', 'new-batch', 'queue', 'history', 'files', 'settings', 'account', 'billing'];
  const isAppMode = appViews.includes(activeView);
  const isAuthPage = ['login', 'signup', 'forgot-password', 'onboarding'].includes(activeView);

  const handleMobileNavigate = (view: ViewState) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  if (isAppMode) {
    return (
      <div className="font-sans bg-background-dark text-white antialiased min-h-screen flex relative overflow-hidden selection:bg-primary/30 selection:text-white">
        <div className="absolute inset-0 z-0 pointer-events-none bg-grid-pattern opacity-40" />
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

        <aside className="w-64 glass-card border-r border-white/5 hidden md:flex flex-col z-20 relative">
          <div className="p-6 flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <Logo className="size-8 text-primary" />
            <span className="font-bold text-lg tracking-tight">BatchTube</span>
          </div>

          <div className="px-4 py-2">
            <button
              onClick={() => onNavigate('new-batch')}
              className="w-full bg-primary hover:bg-primary-hover text-white h-10 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold shadow-lg shadow-primary/20 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Batch
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            <p className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Workspace</p>
            <SidebarItem icon="dashboard" label="Overview" active={activeView === 'dashboard'} onClick={() => onNavigate('dashboard')} />
            <SidebarItem icon="checklist" label="Queue" active={activeView === 'queue'} onClick={() => onNavigate('queue')} />
            <SidebarItem icon="history" label="History" active={activeView === 'history'} onClick={() => onNavigate('history')} />
            <SidebarItem icon="folder_zip" label="Files" active={activeView === 'files'} onClick={() => onNavigate('files')} />

            <p className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 mt-5">Account</p>
            <SidebarItem icon="person" label="Profile" active={activeView === 'account'} onClick={() => onNavigate('account')} />
            <SidebarItem icon="credit_card" label="Billing" active={activeView === 'billing'} onClick={() => onNavigate('billing')} />
            <SidebarItem icon="settings" label="Settings" active={activeView === 'settings'} onClick={() => onNavigate('settings')} />
          </nav>

          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-orange-500 flex items-center justify-center text-xs font-bold text-white">JD</div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate text-white">John Doe</p>
                <p className="text-xs text-primary truncate">Pro Plan</p>
              </div>
              <button onClick={() => onNavigate('landing')} className="text-gray-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          </div>
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-3/4 max-w-xs bg-[#121212] border-r border-white/10 shadow-2xl flex flex-col">
              <div className="p-6 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2"><Logo className="size-6 text-primary" /><span className="font-bold text-lg">BatchTube</span></div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
              </div>
              <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                <SidebarItem icon="dashboard" label="Overview" active={activeView === 'dashboard'} onClick={() => handleMobileNavigate('dashboard')} />
                <SidebarItem icon="checklist" label="Queue" active={activeView === 'queue'} onClick={() => handleMobileNavigate('queue')} />
                <SidebarItem icon="history" label="History" active={activeView === 'history'} onClick={() => handleMobileNavigate('history')} />
                <SidebarItem icon="folder_zip" label="Files" active={activeView === 'files'} onClick={() => handleMobileNavigate('files')} />
                <SidebarItem icon="person" label="Profile" active={activeView === 'account'} onClick={() => handleMobileNavigate('account')} />
                <SidebarItem icon="credit_card" label="Billing" active={activeView === 'billing'} onClick={() => handleMobileNavigate('billing')} />
                <SidebarItem icon="settings" label="Settings" active={activeView === 'settings'} onClick={() => handleMobileNavigate('settings')} />
              </nav>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
          <header className="md:hidden h-16 border-b border-white/5 flex items-center justify-between px-4 bg-background-dark/80 backdrop-blur-md sticky top-0 z-30">
            <div onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 text-gray-400 cursor-pointer"><span className="material-symbols-outlined">menu</span></div>
            <Logo className="size-6 text-primary" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-orange-500 flex items-center justify-center text-xs font-bold text-white">JD</div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans bg-background-dark text-white antialiased min-h-screen flex flex-col relative overflow-hidden selection:bg-primary/30 selection:text-white">
      <div className="absolute inset-0 z-0 pointer-events-none bg-grid-pattern opacity-60" />
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />

      {!isAuthPage && (
        <header className="relative z-50 w-full px-6 md:px-8 py-6 flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
            <Logo className="size-8 text-primary" />
            <span className="text-white font-bold text-xl tracking-tight">BatchTube</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => onNavigate('landing')} className={`text-sm font-medium ${activeView === 'landing' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>Product</button>
            <button onClick={() => onNavigate('pricing')} className={`text-sm font-medium ${activeView === 'pricing' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>Pricing</button>
            <button onClick={() => onNavigate('supported-sites')} className={`text-sm font-medium ${activeView === 'supported-sites' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>Supported Sites</button>
            <button onClick={() => onNavigate('faq')} className={`text-sm font-medium ${activeView === 'faq' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>FAQ</button>
          </nav>

          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('login')} className="text-sm font-medium text-gray-400 hover:text-white transition-colors hidden sm:block">Log in</button>
            <button onClick={() => onNavigate('signup')} className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover transition-colors">Get Started</button>
          </div>
        </header>
      )}

      <main className={`flex-1 flex flex-col relative z-10 ${isAuthPage ? 'items-center justify-center p-4' : ''}`}>{children}</main>

      {!isAuthPage && (
        <footer className="relative z-10 w-full py-10 border-t border-white/5 mt-auto bg-background-dark/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <p>© 2026 BatchTube Inc. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-4">
              <button onClick={() => onNavigate('supported-sites')} className="hover:text-primary">Supported Sites</button>
              <button onClick={() => onNavigate('pricing')} className="hover:text-primary">Pricing</button>
              <button onClick={() => onNavigate('legal')} className="hover:text-primary">Legal</button>
              <button onClick={() => onNavigate('contact')} className="hover:text-primary">Contact</button>
              <button onClick={() => onNavigate('status')} className="hover:text-primary">Status</button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

const SidebarItem: React.FC<{ icon: string; label: string; active?: boolean; onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
      active ? 'bg-primary/10 text-primary border border-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`}
  >
    <span className={`material-symbols-outlined text-[20px] ${active ? 'text-primary' : 'group-hover:text-white'}`}>{icon}</span>
    {label}
  </button>
);
