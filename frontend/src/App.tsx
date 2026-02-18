
import React, { useState, useEffect } from 'react';
import { VideoResult, VideoFormat, SupportedLanguage, SelectionItem, VideoQuality } from './types';
import { TRANSLATIONS } from './constants';
import { api } from './services/apiService';

import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SupportedSitesTeaser } from './components/SupportedSitesTeaser';
import { VideoCard } from './components/VideoCard';
import { SelectionBar } from './components/SelectionBar';
import { SelectionModal } from './components/SelectionModal';
import { ProgressModal } from './components/ProgressModal';
import { PlanLimitModal } from './components/PlanLimitModal';
import { Footer } from './components/Footer';
import { CookieConsent } from './components/CookieConsent';
import { AdSlotSearch } from './components/AdSlotSearch';
import { AdSlotGrid } from './components/AdSlotGrid';
import { loadAdSense, unloadAdSense } from './lib/adLoader';
import { batchAPI } from './services/batchAPI';
import { useCookieConsent } from './components/CookieConsent';
import { getSearchParam, navigate, usePathname, useSearch } from './lib/simpleRouter';
import { shouldShowAds } from './lib/adsPolicy';
import { HowItWorks } from './pages/HowItWorks';
import { Faq } from './pages/Faq';
import { SupportedSites } from './pages/SupportedSites';
import { LegalPage } from './pages/LegalPage';
import { NotFound } from './pages/NotFound';
import { applySeoMeta } from './lib/seo';
import { AccountPage } from './pages/AccountPage';
import { BillingCancelPage } from './pages/BillingCancelPage';
import { BillingSuccessPage } from './pages/BillingSuccessPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LoginPage } from './pages/LoginPage';
import { PricingPage } from './pages/PricingPage';
import { ProfilePage } from './pages/ProfilePage';
import { SignupPage } from './pages/SignupPage';
import { AUTH_CHANGE_EVENT, clearUser, getStoredUser } from './lib/auth';
import { accountAPI } from './services/accountAPI';

const App: React.FC = () => {
  const route = usePathname();
  const search = useSearch();

  // Global State
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [user, setUser] = useState(() => getStoredUser());
  const [planError, setPlanError] = useState<string | null>(null);
  const isProPlan = user?.plan === 'pro';
  const t = TRANSLATIONS[lang];
  const consent = useCookieConsent();
  const consentGranted = consent === 'accepted';
  
  // Search State
  const [results, setResults] = useState<VideoResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearchedOnce, setHasSearchedOnce] = useState(false);
  const [searchError, setSearchError] = useState(false);
  
  // Selection/Batch State
  const [selectedItems, setSelectedItems] = useState<SelectionItem[]>([]);
  const [batchFormat, setBatchFormat] = useState<VideoFormat>('mp3');
  const [batchQuality, setBatchQuality] = useState<VideoQuality>('320k');
  
  // Job/Modal State
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [isPlanLimitModalOpen, setIsPlanLimitModalOpen] = useState(false);

  useEffect(() => {
    if (selectedItems.length <= 3) setPlanError(null);
  }, [selectedItems.length]);

  useEffect(() => {
    if (route !== '/' && route !== '/app') return;
    applySeoMeta({
      title: `BatchTube | ${t.heroTitle}`,
      description: t.heroSubtitle
    });
  }, [lang, route, t.heroTitle, t.heroSubtitle]);

  // Close utility modals when leaving home (keeps content pages clean).
  useEffect(() => {
    if (route !== '/') {
      setIsSelectionModalOpen(false);
      setActiveJobId(null);
    }
  }, [route]);

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser());
    window.addEventListener('storage', syncUser);
    window.addEventListener(AUTH_CHANGE_EVENT, syncUser as EventListener);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener(AUTH_CHANGE_EVENT, syncUser as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    let mounted = true;
    accountAPI
      .getSummary()
      .then((summary) => {
        if (!mounted) return;
        setUser((prev) => (prev ? { ...prev, plan: summary.plan, renewalDate: summary.renewalDate, batchesCount: summary.usage.batchesCount, itemsCount: summary.usage.itemsCount, maxPerBatch: summary.usage.maxPerBatch } : prev));
      })
      .catch(() => {
        // Keep current fallback values
      });

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if ((route === '/account' || route === '/profile') && !user) {
      navigate(`/login?returnUrl=${route}`, { replace: true });
    }
  }, [route, user]);

  useEffect(() => {
    if (!user) return;
    if (route === '/login' || route === '/signup') {
      navigate('/account', { replace: true });
    }
  }, [route, user]);

  // Update default quality when format changes
  useEffect(() => {
    if (batchFormat === 'mp3') {
      setBatchQuality('320k');
    } else {
      setBatchQuality(isProPlan ? '1080p' : '720p');
    }
  }, [batchFormat, isProPlan]);

  useEffect(() => {
    if (isProPlan) return;
    if (batchFormat === 'mp4' && (batchQuality === '1080p' || batchQuality === '1440p' || batchQuality === '4K')) {
      setBatchQuality('720p');
    }
  }, [batchFormat, batchQuality, isProPlan]);

  // Handlers
  const handleAuthChanged = () => {
    setUser(getStoredUser());
  };

  const handleLogout = () => {
    clearUser();
    setUser(null);
    navigate('/');
  };

  const getSelectionKey = (video: VideoResult) => video.url || video.id;

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setResults([]);
    setHasSearchedOnce(true);
    setSearchError(false);
    try {
      const data = await api.search(query);
      setResults(data);
    } catch (e) {
      console.error(e);
      setSearchError(true);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelection = (video: VideoResult, format?: VideoFormat, quality?: VideoQuality) => {
    setSelectedItems(prev => {
      const key = getSelectionKey(video);
      const exists = prev.find(i => getSelectionKey(i.video) === key);
      if (exists) {
        // Remove from selection
        return prev.filter(i => getSelectionKey(i.video) !== key);
      }
      // Add to selection with format and quality
      return [...prev, { 
        video, 
        format: format || batchFormat,
        quality: quality || batchQuality
      }];
    });
  };

  const handleRemoveFromSelection = (itemToRemove: SelectionItem) => {
    const removeKey = getSelectionKey(itemToRemove.video);
    setSelectedItems(prev => prev.filter(item => getSelectionKey(item.video) !== removeKey));
  };

  const handleBatchDownload = async () => {
    if (selectedItems.length === 0) return;
    if (!isProPlan && selectedItems.length > 3) {
      setIsPlanLimitModalOpen(true);
      setPlanError(t.limitMaxItems);
      return;
    }
    try {
      // Map to new API format
      const items = selectedItems.map(item => ({
        url: item.video.url || `https://www.youtube.com/watch?v=${item.video.id}`,
        title: item.video.title || t.metadataUnavailable,
        thumbnail: item.video.thumbnail || (/youtube|youtu\.be/i.test(item.video.url || '') ? `https://i.ytimg.com/vi/${item.video.id}/hqdefault.jpg` : null),
      }));

      // Map quality: '320k' -> '1080p' for MP3, keep as is for MP4
      const quality = batchFormat === 'mp3' 
        ? '1080p' // MP3 doesn't use quality, but API expects it
        : (batchQuality === '4K' ? '4k' : batchQuality === '720p' ? '720p' : batchQuality === '480p' ? '480p' : '1080p');

      const { jobId } = await batchAPI.createJob({
        items,
        format: batchFormat,
        quality: batchFormat === 'mp4' ? quality : undefined
      });
      
      setActiveJobId(jobId);
    } catch (e) {
      console.error("Batch start failed", e);
      const message = e instanceof Error ? e.message : '';
      if (message.includes('PROVIDER_RESTRICTED')) {
        alert(t.limitProviderRestricted);
      } else if (message.includes('LIMIT_MAX_ITEMS')) {
        alert(t.limitMaxItems);
      } else if (message.includes('USAGE_LIMIT_REACHED')) {
        alert(t.limitUsageReached);
      } else {
        alert(t.batchStartFailed);
      }
    }
  };

  const isHome = route === '/' || route === '/app';
  const returnUrlParam = getSearchParam(search, 'returnUrl');
  const returnUrl = returnUrlParam && returnUrlParam.startsWith('/') ? returnUrlParam : undefined;
  const isModalOpen = isSelectionModalOpen || !!activeJobId;
  const isEmptyState = hasSearchedOnce && !isSearching && results.length === 0 && !searchError;
  const hasErrorOrEmpty = !!searchError || isEmptyState;

  const showAds = shouldShowAds({
    route,
    resultsCount: results.length,
    isLoading: isSearching,
    hasError: hasErrorOrEmpty,
    isModalOpen,
    consentGranted
  });

  // Route-aware AdSense loading: only load when ads are allowed to render.
  useEffect(() => {
    if (showAds) loadAdSense();
    else unloadAdSense();
  }, [showAds]);

  return (
    <div className="min-h-screen flex flex-col bg-[#050509] text-white font-sans selection:bg-primary/30 overflow-x-hidden">
      
      <Navbar lang={lang} setLang={setLang} t={t} user={user} onLogout={handleLogout} />
      
      <main className="flex-grow pt-8 sm:pt-12 md:pt-16 pb-16 sm:pb-20 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {isHome ? (
          <>
            <Hero onSearch={handleSearch} loading={isSearching} t={t} />
            <SupportedSitesTeaser t={t} upgradeHref={user ? '/account' : '/login?returnUrl=/'} />

            {planError && (
              <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                {planError}
              </div>
            )}

            {searchError && (
              <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {t.searchFailed}
              </div>
            )}

            {isEmptyState && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-neutral-300">
                {t.noResultsFound}
              </div>
            )}

            {/* Ad Slot: Below Search Bar (strict policy) */}
            {showAds && <AdSlotSearch />}

            <div className="grid gap-5 sm:gap-6 grid-cols-[repeat(auto-fit,minmax(280px,1fr))] place-items-start animate-fadeIn">
              {results.map((video, index) => (
                <React.Fragment key={getSelectionKey(video)}>
                  <VideoCard
                    video={video}
                    isSelected={!!selectedItems.find(i => getSelectionKey(i.video) === getSelectionKey(video))}
                    onSelect={(format, quality) => toggleSelection(video, format, quality)}
                    t={t}
                  />
                  {/* Ad Slot: After every 8th video card (strict policy) */}
                  {showAds && (index + 1) % 8 === 0 && (
                    <AdSlotGrid index={Math.floor((index + 1) / 8)} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </>
        ) : route === '/how-it-works' ? (
          <HowItWorks lang={lang} t={t} />
        ) : route === '/faq' ? (
          <Faq lang={lang} t={t} />
        ) : route === '/supported-sites' ? (
          <SupportedSites lang={lang} t={t} />
        ) : route === '/pricing' ? (
          <PricingPage t={t} user={user} />
        ) : route === '/profile' ? (
          user ? <ProfilePage t={t} user={user} /> : <LoginPage t={t} onAuthChanged={handleAuthChanged} returnUrl="/profile" />
        ) : route === '/account' ? (
          user ? <AccountPage t={t} user={user} /> : <LoginPage t={t} onAuthChanged={handleAuthChanged} returnUrl="/account" />
        ) : route === '/login' ? (
          <LoginPage t={t} onAuthChanged={handleAuthChanged} returnUrl={returnUrl} />
        ) : route === '/signup' ? (
          <SignupPage t={t} onAuthChanged={handleAuthChanged} returnUrl={returnUrl} />
        ) : route === '/forgot-password' ? (
          <ForgotPasswordPage t={t} />
        ) : route === '/billing/success' ? (
          <BillingSuccessPage t={t} />
        ) : route === '/billing/cancel' ? (
          <BillingCancelPage t={t} />
        ) : route === '/legal' ? (
          <LegalPage type="legal" lang={lang} t={t} />
        ) : route === '/terms' ? (
          <LegalPage type="terms" lang={lang} t={t} />
        ) : route === '/privacy' ? (
          <LegalPage type="privacy" lang={lang} t={t} />
        ) : route === '/cookies' ? (
          <LegalPage type="cookies" lang={lang} t={t} />
        ) : route === '/refund' ? (
          <LegalPage type="refund" lang={lang} t={t} />
        ) : (
          <NotFound t={t} />
        )}
      </main>

      {isHome && (
        <SelectionBar 
          count={selectedItems.length}
          format={batchFormat}
          isProPlan={isProPlan}
          setFormat={setBatchFormat}
          quality={batchQuality}
          setQuality={setBatchQuality}
          onClear={() => setSelectedItems([])}
          onDownload={handleBatchDownload}
          onViewList={() => setIsSelectionModalOpen(true)}
          t={t}
        />
      )}

      <Footer t={t} />

      {isHome && (
        <SelectionModal
          isOpen={isSelectionModalOpen}
          onClose={() => setIsSelectionModalOpen(false)}
          items={selectedItems}
          onRemove={handleRemoveFromSelection}
          t={t}
        />
      )}

      {isHome && activeJobId && (
        <ProgressModal 
          jobId={activeJobId} 
          onClose={() => setActiveJobId(null)} 
          totalItems={selectedItems.length}
          t={t}
        />
      )}

      {isHome && (
        <PlanLimitModal
          isOpen={isPlanLimitModalOpen}
          onClose={() => setIsPlanLimitModalOpen(false)}
          t={t}
        />
      )}

      <CookieConsent t={t} />
    </div>
  );
};

export default App;
