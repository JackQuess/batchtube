import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Settings } from 'lucide-react';
import { BatchTubeLogo } from './components/BatchTubeLogo';
import { ModalType } from './types';
import { AuthScreen } from './components/AuthScreen';
import { SmartBar } from './components/SmartBar';
import { ModalWrapper } from './components/ModalWrapper';
import { SettingsModal } from './components/Modals/SettingsModal';
import { FilesModal } from './components/Modals/FilesModal';
import { HistoryModal } from './components/Modals/HistoryModal';
import { SupportedSitesModal } from './components/Modals/SupportedSitesModal';
import { PricingModal } from './components/Modals/PricingModal';
import { ProfileModal } from './components/Modals/ProfileModal';
import { ApiModal } from './components/Modals/ApiModal';
import { BatchDetailsModal } from './components/Modals/BatchDetailsModal';
import { SourceSelectionModal } from './components/SourceSelectionModal';
import { FloatingProcessingPanel } from './components/FloatingProcessingPanel';
import {
  getStoredUser,
  clearUser,
  loginWithEmail,
  registerWithEmail,
  initializeAuth,
  AUTH_CHANGE_EVENT,
} from './lib/auth';
import { hasSupabaseConfig } from './lib/supabaseClient';
import { batchAPI } from './services/batchAPI';
import { saveTrackedJob } from './lib/trackedJobs';
import { ApiError } from './lib/apiClient';
import { usePathname, navigate } from './lib/simpleRouter';
import { LandingPage } from './pages/LandingPage';
import { PublicLayout } from './components/PublicLayout';
import { Faq } from './pages/Faq';
import { HowItWorks } from './pages/HowItWorks';
import { SupportedSites } from './pages/SupportedSites';
import { PricingPage } from './pages/PricingPage';
import { ChangelogPage } from './pages/ChangelogPage';
import { ApiDocsPage } from './pages/ApiDocsPage';
import { WebhooksPage } from './pages/WebhooksPage';
import { StatusPage } from './pages/StatusPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { TRANSLATIONS } from './constants';
import { UpScalePage } from './pages/UpScalePage';
import { accountAPI } from './services/accountAPI';

function normalizeAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('cors') || lower.includes('empty_response')) {
    return 'Supabase\'e bağlanılamadı. Projenizin aktif olduğundan emin olun (Dashboard → projeyi uyandırın). Authentication → URL Configuration bölümüne "http://localhost:5173" ekleyin.';
  }
  return message;
}

const App: React.FC = () => {
  const pathname = usePathname();
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(getStoredUser());
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [activeBatchIds, setActiveBatchIds] = useState<string[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchCreating, setBatchCreating] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [sourceSelection, setSourceSelection] = useState<{ url: string; type: 'channel' | 'playlist' | 'profile'; provider: string } | null>(null);
  const [logicalPlan, setLogicalPlan] = useState<'free' | 'pro' | 'ultra' | null>(null);

  const isAuthPath = pathname === '/login' || pathname === '/signup';
  const isAppPath = pathname === '/app' || pathname === '/upscale';

  useEffect(() => {
    if (!user && isAppPath) {
      navigate('/login', { replace: true });
    }
  }, [user, isAppPath]);

  useEffect(() => {
    if (user && (pathname === '/' || isAuthPath)) {
      navigate('/app', { replace: true });
    }
  }, [user, pathname, isAuthPath]);

  useEffect(() => {
    void initializeAuth().then((u) => setUser(u ?? null));
    const handler = () => setUser(getStoredUser());
    window.addEventListener(AUTH_CHANGE_EVENT, handler);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, handler);
  }, []);

  // Load logical plan (free / pro / ultra) for UpScale PRO badge in global navbar.
  useEffect(() => {
    if (!user) {
      setLogicalPlan(null);
      return;
    }
    let active = true;
    const loadPlan = async () => {
      try {
        const usage = await accountAPI.getUsage();
        if (!active) return;
        const planLogical: 'free' | 'pro' | 'ultra' =
          usage.plan_logical ??
          (usage.plan === 'pro' ? 'pro' : usage.plan === 'free' ? 'free' : 'ultra');
        setLogicalPlan(planLogical);
      } catch {
        if (!active) return;
        setLogicalPlan(null);
      }
    };
    void loadPlan();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const handleLogin = useCallback(() => {
    setUser(getStoredUser());
    setAuthError(null);
    navigate('/app', { replace: true });
  }, []);

  const handleLogout = useCallback(() => {
    clearUser();
    setUser(null);
    setActiveModal(null);
  }, []);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await loginWithEmail(email, password);
      handleLogin();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sign in failed';
      setAuthError(normalizeAuthError(msg));
    } finally {
      setAuthLoading(false);
    }
  }, [handleLogin]);

  const handleSignUp = useCallback(async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await registerWithEmail(email, password);
      handleLogin();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sign up failed';
      setAuthError(normalizeAuthError(msg));
    } finally {
      setAuthLoading(false);
    }
  }, [handleLogin]);

  const handleCommand = useCallback((_cmd: string, type: ModalType) => {
    setActiveModal(type);
  }, []);

  const handleStartBatch = useCallback(async (opts: { urls: string[]; format?: 'mp3' | 'mp4' | 'mkv'; quality?: 'best' | '720p' | '1080p' | '4k' }) => {
    setBatchError(null);
    if (opts.urls.length === 0) return;
    setBatchCreating(true);
    try {
      const { jobId } = await batchAPI.createJob({
        items: opts.urls.map((url) => ({ url, title: url })),
        format: opts.format ?? 'mp4',
        quality: opts.quality ?? 'best',
      });
      const name = `Batch_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}`;
      saveTrackedJob({
        jobId,
        name,
        createdAt: new Date().toISOString(),
        itemsCount: opts.urls.length,
        format: opts.format ?? 'mp4',
        quality: opts.quality ?? 'best',
        urls: opts.urls,
      });
      setActiveBatchIds((prev) => [...prev, jobId]);
      window.dispatchEvent(new Event('batchtube:usage-refresh'));
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === 'insufficient_credits') setBatchError('Yetersiz kredi. Planınızı yükseltin.');
        else if (e.code === 'unauthorized') setBatchError('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
        else {
          const msg = e.message ?? '';
          const fallback = 'İndirme başlatılamadı. Bağlantıyı veya kredinizi kontrol edip tekrar deneyin.';
          setBatchError(msg === 'İstek başarısız.' ? fallback : (msg || fallback));
        }
      } else setBatchError('İndirme başlatılamadı. Bağlantıyı kontrol edip tekrar deneyin.');
      window.dispatchEvent(new Event('batchtube:usage-refresh'));
    } finally {
      setBatchCreating(false);
    }
  }, []);

  const handleStartArchive = useCallback(async (opts: { sourceUrl: string; mode: 'latest_25' | 'latest_n' | 'all' | 'select'; latestN?: number }) => {
    setBatchError(null);
    setBatchCreating(true);
    try {
      const mode = opts.mode === 'select' ? 'latest_25' : opts.mode;
      const { jobId } = await batchAPI.createArchive({
        source_url: opts.sourceUrl,
        mode,
        latest_n: opts.mode === 'latest_n' ? opts.latestN : undefined,
      });
      const name = `Archive_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}`;
      saveTrackedJob({
        jobId,
        name,
        createdAt: new Date().toISOString(),
        itemsCount: 0,
        format: 'mp4',
        quality: 'best',
        urls: [opts.sourceUrl],
      });
      setActiveBatchIds((prev) => [...prev, jobId]);
      window.dispatchEvent(new Event('batchtube:usage-refresh'));
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === 'insufficient_credits') setBatchError('Yetersiz kredi. Planınızı yükseltin.');
        else if (e.code === 'unauthorized') setBatchError('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
        else {
          const msg = e.message ?? '';
          setBatchError(msg || 'Arşiv başlatılamadı.');
        }
      } else setBatchError('Arşiv başlatılamadı. Bağlantıyı kontrol edin.');
      window.dispatchEvent(new Event('batchtube:usage-refresh'));
    } finally {
      setBatchCreating(false);
    }
  }, []);

  const handleStartProcessing = useCallback(() => {
    setBatchError(null);
  }, []);

  const handleRemoveBatchId = useCallback((id: string) => {
    setActiveBatchIds((prev) => prev.filter((b) => b !== id));
  }, []);

  if (!hasSupabaseConfig) {
    return (
      <div className="min-h-screen bg-app-bg text-white flex items-center justify-center px-6">
        <div className="glass-panel rounded-2xl border border-red-500/40 p-8 max-w-xl w-full text-center">
          <h1 className="text-2xl font-bold mb-3">Supabase yapılandırması eksik</h1>
          <p className="text-app-muted text-sm leading-relaxed">
            Uygulama çalışması için <code>VITE_SUPABASE_URL</code> ve <code>VITE_SUPABASE_ANON_KEY</code> tanımlanmalı.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (isAuthPath) {
      return (
        <div className="min-h-screen bg-app-bg text-app-text relative overflow-hidden">
          <div className="bg-grid" />
          <AuthScreen
            onLogin={handleLogin}
            onNavigateToLanding={() => navigate('/')}
            onNavigateToSignUp={() => navigate('/signup')}
            signIn={handleSignIn}
            signUp={handleSignUp}
            isLoading={authLoading}
            error={authError}
            clearError={() => setAuthError(null)}
          />
        </div>
      );
    }
    const lang = 'en';
    const t = TRANSLATIONS.en;
    if (pathname === '/pricing') {
      return (
        <PublicLayout onBack={() => navigate('/')} title="Pricing">
          <PricingPage t={t} user={null} onUpgrade={() => navigate('/signup')} />
        </PublicLayout>
      );
    }
    if (pathname === '/faq') {
      return (
        <PublicLayout onBack={() => navigate('/')} title="FAQ">
          <Faq lang={lang} t={t} />
        </PublicLayout>
      );
    }
    if (pathname === '/how-it-works') {
      return (
        <PublicLayout onBack={() => navigate('/')} title="How it works">
          <HowItWorks lang={lang} t={t} />
        </PublicLayout>
      );
    }
    if (pathname === '/supported-sites') {
      return (
        <PublicLayout onBack={() => navigate('/')} title="Supported sites">
          <SupportedSites lang={lang} t={t} />
        </PublicLayout>
      );
    }
    if (pathname === '/privacy') {
      return <PrivacyPolicyPage />;
    }
    if (pathname === '/terms') {
      return <TermsOfServicePage />;
    }
    if (pathname === '/changelog') {
      return <ChangelogPage />;
    }
    if (pathname === '/api-docs') {
      return <ApiDocsPage />;
    }
    if (pathname === '/webhooks') {
      return <WebhooksPage />;
    }
    if (pathname === '/status') {
      return <StatusPage />;
    }
    if (pathname === '/features') {
      return <FeaturesPage />;
    }
    return (
      <div className="min-h-screen bg-app-bg text-app-text relative overflow-x-hidden">
        <LandingPage
          onNavigateToLogin={() => navigate('/login')}
          onNavigateToSignUp={() => navigate('/signup')}
          onNavigateToApp={() => navigate('/app')}
          onNavigate={(path) => navigate(path)}
        />
      </div>
    );
  }

  const displayName = user.email?.split('@')[0] ?? 'User';
  const initials = displayName.slice(0, 2).toUpperCase();
  const isUpScalePath = pathname === '/upscale';

  return (
    <div className="min-h-screen bg-app-bg text-app-text relative overflow-hidden flex flex-col">
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-app-primary rounded-full blur-[120px] pointer-events-none"
      />

      <div className="bg-grid" />

      {/* Top nav */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
        <BatchTubeLogo size="sm" />
      </div>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex items-center">
        <div className="inline-flex items-center gap-1 rounded-full bg-black/50 border border-white/10 px-1 py-1 text-[11px]">
          <button
            type="button"
            onClick={() => navigate('/app')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !isUpScalePath
                ? 'bg-white text-black'
                : 'text-app-muted hover:text-white hover:bg-white/5'
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate('/upscale')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              isUpScalePath
                ? 'bg-white text-black'
                : 'text-app-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <span>UpScale</span>
            {logicalPlan === 'free' && (
              <span className="ml-2 text-[9px] uppercase tracking-[0.18em] px-1.5 py-0.5 rounded-full bg-[#981b3c] text-white">
                PRO
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="absolute top-6 right-6 z-10">
        <button
          type="button"
          onClick={() => setActiveModal('profile')}
          className="flex items-center gap-3 p-1.5 pr-4 rounded-full glass-panel hover:bg-white/10 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] group"
        >
          <div className="w-7 h-7 rounded-full bg-app-primary/20 flex items-center justify-center text-app-primary text-xs font-medium border border-app-primary/30">
            {initials}
          </div>
          <span className="text-xs font-medium text-app-muted group-hover:text-white transition-colors">{displayName}</span>
        </button>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full">
        {isUpScalePath ? (
          <UpScalePage />
        ) : (
          <>
            {batchCreating && (
              <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 text-sm text-app-muted bg-white/5 border border-app-border rounded-xl px-4 py-2 flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-app-primary border-t-transparent rounded-full animate-spin" />
                Creating batch...
              </div>
            )}
            {batchError && (
              <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                {batchError}
              </div>
            )}
            <SmartBar
              onCommand={handleCommand}
              onStartProcessing={handleStartProcessing}
              onOpenSourcePicker={(url, provider, kind) => {
                setSourceSelection({ url, type: kind, provider });
                setActiveModal('sourceSelection');
              }}
              onStartBatch={handleStartBatch}
              onStartArchive={handleStartArchive}
            />
          </>
        )}
      </main>

      <div className="absolute bottom-6 left-6 z-10">
        <button
          type="button"
          onClick={() => setActiveModal('settings')}
          className="p-3 rounded-xl glass-panel hover:bg-white/10 text-app-muted hover:text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] group"
        >
          <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
        </button>
      </div>

      <FloatingProcessingPanel
        batchIds={activeBatchIds}
        isOpen={activeBatchIds.length > 0}
        onClose={() => setActiveBatchIds([])}
        onRemoveBatchId={handleRemoveBatchId}
      />

      <ModalWrapper isOpen={activeModal === 'settings'} onClose={() => setActiveModal(null)} title="Settings" width="sm">
        <SettingsModal
          onNavigate={(modal) => setActiveModal(modal)}
          onLogout={handleLogout}
        />
      </ModalWrapper>

      <ModalWrapper isOpen={activeModal === 'files'} onClose={() => setActiveModal(null)} title="Files" width="lg">
        <FilesModal onClose={() => setActiveModal(null)} />
      </ModalWrapper>

      <ModalWrapper isOpen={activeModal === 'history'} onClose={() => setActiveModal(null)} title="History" width="md">
        <HistoryModal
          onClose={() => setActiveModal(null)}
          onSelectBatch={(id) => {
            setSelectedBatchId(id);
            setActiveModal('batchDetails');
          }}
        />
      </ModalWrapper>

      <ModalWrapper isOpen={activeModal === 'supportedSites'} onClose={() => setActiveModal(null)} title="Supported Sites" width="lg">
        <SupportedSitesModal onClose={() => setActiveModal(null)} />
      </ModalWrapper>

      <ModalWrapper isOpen={activeModal === 'pricing'} onClose={() => setActiveModal(null)} title="Plans & Pricing" width="xl">
        <PricingModal onClose={() => setActiveModal(null)} />
      </ModalWrapper>

      <ModalWrapper isOpen={activeModal === 'profile'} onClose={() => setActiveModal(null)} title="Profile Settings" width="md">
        <ProfileModal user={user} onClose={() => setActiveModal(null)} />
      </ModalWrapper>

      <ModalWrapper isOpen={activeModal === 'api'} onClose={() => setActiveModal(null)} title="API & Webhooks" width="md">
        <ApiModal onClose={() => setActiveModal(null)} />
      </ModalWrapper>

      <ModalWrapper
        isOpen={activeModal === 'batchDetails'}
        onClose={() => {
          setActiveModal(null);
          setSelectedBatchId(null);
        }}
        title="Batch details"
        width="lg"
      >
        {selectedBatchId && (
          <BatchDetailsModal
            batchId={selectedBatchId}
            onClose={() => {
              setActiveModal(null);
              setSelectedBatchId(null);
            }}
          />
        )}
      </ModalWrapper>
      <ModalWrapper
        isOpen={activeModal === 'sourceSelection'}
        onClose={() => {
          setActiveModal(null);
          setSourceSelection(null);
        }}
        title="Select items"
        width="lg"
      >
        {sourceSelection && (
          <SourceSelectionModal
            sourceUrl={sourceSelection.url}
            sourceType={sourceSelection.type}
            provider={sourceSelection.provider}
            onDownloadSelected={(urls) => {
              handleStartBatch({ urls });
              setActiveModal(null);
              setSourceSelection(null);
            }}
            onAddToBatch={(urls) => {
              handleStartBatch({ urls });
              setActiveModal(null);
              setSourceSelection(null);
            }}
            onCancel={() => {
              setActiveModal(null);
              setSourceSelection(null);
            }}
          />
        )}
      </ModalWrapper>
    </div>
  );
};

export default App;
