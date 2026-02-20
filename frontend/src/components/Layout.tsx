import React, { useEffect, useMemo, useState } from 'react';
import { Logo } from './Logo';
import { ViewState } from '../types';
import { clearUser, getStoredUser } from '../lib/auth';
import { getCookieConsent, loadAdSense, setCookieConsent, unloadAdSense } from '../lib/adLoader';
import { accountAPI } from '../services/accountAPI';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewState;
  onNavigate: (view: ViewState) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cookieConsent, setCookieConsentState] = useState<'accepted' | 'rejected' | null>(() => getCookieConsent());
  const user = getStoredUser();
  const displayName = useMemo(() => user?.email?.split('@')[0] || 'Guest', [user?.email]);
  const [creditsPanelOpen, setCreditsPanelOpen] = useState(false);

  const appViews: ViewState[] = ['dashboard', 'new-batch', 'queue', 'history', 'files', 'settings', 'account', 'billing'];
  const isAppMode = appViews.includes(activeView);
  const isAuthPage = ['login', 'signup', 'forgot-password', 'onboarding'].includes(activeView);
  const [credits, setCredits] = useState<{ used: number; limit: number; available: number; plan: string; cycleReset: string } | null>(null);

  const handleMobileNavigate = (view: ViewState) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  const handleSignOut = () => {
    clearUser();
    onNavigate('landing');
  };

  useEffect(() => {
    if (cookieConsent === 'accepted') {
      loadAdSense();
    } else if (cookieConsent === 'rejected') {
      unloadAdSense();
    }
  }, [cookieConsent]);

  useEffect(() => {
    if (!isAppMode || !user?.id) {
      setCredits(null);
      return;
    }

    let mounted = true;
    const loadCredits = async () => {
      try {
        const usage = await accountAPI.getUsage();
        if (!mounted) return;
        setCredits({
          used: usage.credits.used,
          limit: usage.credits.limit,
          available: usage.credits.available,
          plan: usage.plan,
          cycleReset: usage.cycle_reset
        });
      } catch {
        if (!mounted) return;
        setCredits(null);
      }
    };

    void loadCredits();
    const refresh = () => void loadCredits();
    window.addEventListener('batchtube:usage-refresh', refresh);
    return () => {
      mounted = false;
      window.removeEventListener('batchtube:usage-refresh', refresh);
    };
  }, [isAppMode, user?.id]);

  const handleCookieConsent = (value: 'accepted' | 'rejected') => {
    setCookieConsent(value);
    setCookieConsentState(value);
  };

  if (isAppMode) {
    return (
      <div className="font-sans bg-background-dark text-white antialiased min-h-screen flex relative overflow-hidden selection:bg-primary/30 selection:text-white">
        <div className="absolute inset-0 z-0 pointer-events-none bg-grid-pattern opacity-40"></div>
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

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

          <div className="px-4 py-2 relative">
            <button
              type="button"
              onClick={() => setCreditsPanelOpen((prev) => !prev)}
              className="w-full text-left rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 hover:border-primary/40 transition-colors"
            >
              <p className="text-[11px] uppercase tracking-wider text-gray-500">Credits</p>
              <p className="text-sm font-semibold text-white">
                {credits ? `${credits.available} / ${credits.limit}` : '-- / --'}
              </p>
              <p className="text-[11px] text-gray-500">
                {credits ? `${credits.plan.toUpperCase()} · reset ${new Date(credits.cycleReset).toLocaleDateString()}` : 'Plan bilgisi yükleniyor'}
              </p>
            </button>

            {creditsPanelOpen && credits && (
              <div className="absolute left-4 right-4 mt-2 rounded-lg border border-white/15 bg-[#0f1117] shadow-2xl p-3 z-30">
                <p className="text-xs text-gray-400">Plan: <span className="text-white uppercase">{credits.plan}</span></p>
                <p className="text-xs text-gray-400 mt-1">Used: <span className="text-white">{credits.used}</span></p>
                <p className="text-xs text-gray-400 mt-1">Reset: <span className="text-white">{new Date(credits.cycleReset).toLocaleDateString()}</span></p>
                <button
                  type="button"
                  onClick={() => onNavigate('pricing')}
                  className="mt-3 w-full text-xs font-semibold rounded-md bg-primary hover:bg-primary-hover text-white py-2"
                >
                  Upgrade
                </button>
              </div>
            )}
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            <div className="pb-2">
              <p className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Workspace</p>
              <SidebarItem icon="dashboard" label="Overview" active={activeView === 'dashboard'} onClick={() => onNavigate('dashboard')} />
              <SidebarItem icon="checklist" label="Queue" active={activeView === 'queue'} onClick={() => onNavigate('queue')} />
              <SidebarItem icon="history" label="History" active={activeView === 'history'} onClick={() => onNavigate('history')} />
              <SidebarItem icon="folder_zip" label="Files" active={activeView === 'files'} onClick={() => onNavigate('files')} />
            </div>

            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Account</p>
              <SidebarItem icon="person" label="Profile" active={activeView === 'account'} onClick={() => onNavigate('account')} />
              <SidebarItem icon="credit_card" label="Billing" active={activeView === 'billing'} onClick={() => onNavigate('billing')} />
              <SidebarItem icon="settings" label="Settings" active={activeView === 'settings'} onClick={() => onNavigate('settings')} />
            </div>
          </nav>

          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-orange-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-primary/20">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate text-white">{displayName}</p>
                <p className="text-xs text-primary truncate">{user?.email || 'No session'}</p>
              </div>
              <button onClick={handleSignOut} className="text-gray-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          </div>
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setMobileMenuOpen(false)}
            ></div>

            <div className="absolute inset-y-0 left-0 w-3/4 max-w-xs bg-[#121212] border-r border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
              <div className="p-6 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Logo className="size-6 text-primary" />
                  <span className="font-bold text-lg">BatchTube</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-4">
                <button
                  onClick={() => handleMobileNavigate('new-batch')}
                  className="w-full bg-primary text-white h-10 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  New Batch
                </button>
              </div>

              <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
                <p className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 mt-2">Workspace</p>
                <SidebarItem icon="dashboard" label="Overview" active={activeView === 'dashboard'} onClick={() => handleMobileNavigate('dashboard')} />
                <SidebarItem icon="checklist" label="Queue" active={activeView === 'queue'} onClick={() => handleMobileNavigate('queue')} />
                <SidebarItem icon="history" label="History" active={activeView === 'history'} onClick={() => handleMobileNavigate('history')} />
                <SidebarItem icon="folder_zip" label="Files" active={activeView === 'files'} onClick={() => handleMobileNavigate('files')} />

                <div className="h-px bg-white/5 my-4"></div>

                <p className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Account</p>
                <SidebarItem icon="person" label="Profile" active={activeView === 'account'} onClick={() => handleMobileNavigate('account')} />
                <SidebarItem icon="credit_card" label="Billing" active={activeView === 'billing'} onClick={() => handleMobileNavigate('billing')} />
                <SidebarItem icon="settings" label="Settings" active={activeView === 'settings'} onClick={() => handleMobileNavigate('settings')} />
              </nav>

              <div className="p-4 border-t border-white/5">
                <button onClick={handleSignOut} className="flex items-center gap-3 text-gray-400 hover:text-white w-full px-3 py-2">
                  <span className="material-symbols-outlined">logout</span>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
          <header className="md:hidden h-16 border-b border-white/5 flex items-center justify-between px-4 bg-background-dark/80 backdrop-blur-md sticky top-0 z-30">
            <div onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 text-gray-400 cursor-pointer">
              <span className="material-symbols-outlined">menu</span>
            </div>
            <Logo className="size-6 text-primary" />
            <div className="text-right">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-orange-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-primary/20 ml-auto">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              {credits && <p className="text-[10px] text-gray-400 mt-1">{credits.available} cr</p>}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans bg-background-dark text-white antialiased min-h-screen flex flex-col relative overflow-hidden selection:bg-primary/30 selection:text-white">
      <div className="absolute inset-0 z-0 pointer-events-none bg-grid-pattern opacity-60"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>

      {!isAuthPage && (
        <header className="relative z-50 w-full px-6 md:px-8 py-6 flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('landing')}>
            <Logo className="size-8 text-primary transition-transform group-hover:scale-110" />
            <span className="text-white font-bold text-xl tracking-tight">BatchTube</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => onNavigate('landing')} className={`text-sm font-medium transition-colors ${activeView === 'landing' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
              Product
            </button>
            <button onClick={() => onNavigate('pricing')} className={`text-sm font-medium transition-colors ${activeView === 'pricing' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
              Pricing
            </button>
            <button onClick={() => onNavigate('supported-sites')} className={`text-sm font-medium transition-colors ${activeView === 'supported-sites' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
              Supported Sites
            </button>
            <button onClick={() => onNavigate('faq')} className={`text-sm font-medium transition-colors ${activeView === 'faq' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
              FAQ
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('login')} className="text-sm font-medium text-gray-400 hover:text-white transition-colors hidden sm:block">
              Log in
            </button>
            <button onClick={() => onNavigate('signup')} className="text-sm font-medium bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition-colors">
              Get Started
            </button>
          </div>
        </header>
      )}

      <main className={`flex-1 flex flex-col relative z-10 ${isAuthPage ? 'items-center justify-center p-4' : ''}`}>{children}</main>

      {!isAppMode && (
        <footer className="relative z-10 w-full py-12 border-t border-white/5 mt-auto bg-background-dark/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <Logo className="size-6 text-gray-600 mb-4" />
              <p className="text-gray-500 text-xs leading-relaxed">The ultimate multi-provider batch downloader. Paste links, get ZIPs.</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">Product</h4>
              <ul className="space-y-2 text-xs text-gray-500">
                <li>
                  <button onClick={() => onNavigate('landing')} className="hover:text-primary transition-colors">
                    Features
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('pricing')} className="hover:text-primary transition-colors">
                    Pricing
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('supported-sites')} className="hover:text-primary transition-colors">
                    Supported Sites
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">Support</h4>
              <ul className="space-y-2 text-xs text-gray-500">
                <li>
                  <button onClick={() => onNavigate('faq')} className="hover:text-primary transition-colors">
                    FAQ
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('contact')} className="hover:text-primary transition-colors">
                    Contact
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('status')} className="hover:text-primary transition-colors">
                    Status
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">Legal</h4>
              <ul className="space-y-2 text-xs text-gray-500">
                <li>
                  <button onClick={() => onNavigate('legal')} className="hover:text-primary transition-colors">
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('legal')} className="hover:text-primary transition-colors">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('legal')} className="hover:text-primary transition-colors">
                    Refund Policy
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="text-center text-xs text-gray-700 border-t border-white/5 pt-6">© 2026 BatchTube Inc. Multi-platform downloading engine.</div>
        </footer>
      )}

      {!cookieConsent && (
        <div className="fixed bottom-4 left-4 right-4 z-[70]">
          <div className="max-w-4xl mx-auto glass-card border border-white/10 rounded-xl px-4 py-3 md:px-5 md:py-4 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
              <p className="text-xs md:text-sm text-gray-300 leading-relaxed flex-1">
                Bu sitede işlevsellik ve reklam gösterimi için çerezler kullanıyoruz.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCookieConsent('rejected')}
                  className="px-3 py-2 rounded-lg text-xs md:text-sm border border-white/15 text-gray-300 hover:text-white hover:border-white/30 transition-colors"
                >
                  Reddet
                </button>
                <button
                  onClick={() => handleCookieConsent('accepted')}
                  className="px-3 py-2 rounded-lg text-xs md:text-sm bg-primary text-white hover:bg-primary-hover transition-colors"
                >
                  Kabul Et
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SidebarItemProps {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
      active
        ? 'bg-primary/15 text-white border border-primary/30 shadow-lg shadow-primary/10'
        : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
    }`}
  >
    <span className="material-symbols-outlined text-[18px]">{icon}</span>
    <span className="font-medium">{label}</span>
  </button>
);
