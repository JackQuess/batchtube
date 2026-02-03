
import React, { useState, useEffect } from 'react';
import { VideoResult, VideoFormat, SupportedLanguage, SelectionItem, VideoQuality } from './types';
import { TRANSLATIONS } from './constants';
import { api } from './services/apiService';

import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { VideoCard } from './components/VideoCard';
import { SelectionBar } from './components/SelectionBar';
import { SelectionModal } from './components/SelectionModal';
import { ProgressModal } from './components/ProgressModal';
import { Footer } from './components/Footer';
import { CookieConsent } from './components/CookieConsent';
import { AdSlotSearch } from './components/AdSlotSearch';
import { AdSlotGrid } from './components/AdSlotGrid';
import { loadAdSense, unloadAdSense } from './lib/adLoader';
import { batchAPI } from './services/batchAPI';
import { useCookieConsent } from './components/CookieConsent';
import { usePathname } from './lib/simpleRouter';
import { shouldShowAds } from './lib/adsPolicy';
import { HowItWorks } from './pages/HowItWorks';
import { Faq } from './pages/Faq';
import { SupportedSites } from './pages/SupportedSites';
import { LegalPage } from './pages/LegalPage';
import { NotFound } from './pages/NotFound';
import { applySeoMeta } from './lib/seo';

const App: React.FC = () => {
  const route = usePathname();

  // Global State
  const [lang, setLang] = useState<SupportedLanguage>('en');
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

  useEffect(() => {
    if (route !== '/') return;
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

  // Update default quality when format changes
  useEffect(() => {
    if (batchFormat === 'mp3') {
      setBatchQuality('320k');
    } else {
      setBatchQuality('1080p');
    }
  }, [batchFormat]);

  // Handlers
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
      const exists = prev.find(i => i.video.id === video.id);
      if (exists) {
        // Remove from selection
        return prev.filter(i => i.video.id !== video.id);
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
    setSelectedItems(prev => prev.filter(item => item.video.id !== itemToRemove.video.id));
  };

  const handleBatchDownload = async () => {
    if (selectedItems.length === 0) return;
    try {
      // Map to new API format
      const items = selectedItems.map(item => ({
        url: `https://www.youtube.com/watch?v=${item.video.id}`,
        title: item.video.title || t.metadataUnavailable,
        thumbnail: item.video.thumbnail || `https://i.ytimg.com/vi/${item.video.id}/hqdefault.jpg`,
      }));

      // Map quality: '320k' -> '1080p' for MP3, keep as is for MP4
      const quality = batchFormat === 'mp3' 
        ? '1080p' // MP3 doesn't use quality, but API expects it
        : (batchQuality === '4K' ? '4k' : '1080p');

      const { jobId } = await batchAPI.createJob({
        items,
        format: batchFormat,
        quality: batchFormat === 'mp4' ? quality : undefined
      });
      
      setActiveJobId(jobId);
    } catch (e) {
      console.error("Batch start failed", e);
      alert(t.batchStartFailed);
    }
  };

  const isHome = route === '/';
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
      
      <Navbar lang={lang} setLang={setLang} />
      
      <main className="flex-grow pt-8 sm:pt-12 md:pt-16 pb-16 sm:pb-20 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {isHome ? (
          <>
            <Hero onSearch={handleSearch} loading={isSearching} t={t} />

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

            <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 animate-fadeIn">
              {results.map((video, index) => (
                <React.Fragment key={video.id}>
                  <VideoCard
                    video={video}
                    isSelected={!!selectedItems.find(i => i.video.id === video.id)}
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
        ) : route === '/legal' ? (
          <LegalPage type="legal" lang={lang} t={t} />
        ) : route === '/terms' ? (
          <LegalPage type="terms" lang={lang} t={t} />
        ) : route === '/privacy' ? (
          <LegalPage type="privacy" lang={lang} t={t} />
        ) : route === '/cookies' ? (
          <LegalPage type="cookies" lang={lang} t={t} />
        ) : (
          <NotFound t={t} />
        )}
      </main>

      {isHome && (
        <SelectionBar 
          count={selectedItems.length}
          format={batchFormat}
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

      <CookieConsent t={t} />
    </div>
  );
};

export default App;
