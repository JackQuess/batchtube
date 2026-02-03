import React, { useEffect, useState } from 'react';
import { VideoResult, VideoFormat, SelectionItem, LegalDocType, VideoQuality } from './types';
import { TRANSLATIONS } from './constants';
import { api } from './services/apiService';

import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { VideoCard } from './components/VideoCard';
import { SelectionBar } from './components/SelectionBar';
import { SelectionModal } from './components/SelectionModal';
import { ProgressModal } from './components/ProgressModal';
import { LegalModal } from './components/LegalModal';
import { Footer } from './components/Footer';
import { CookieConsent } from './components/CookieConsent';
import { AdSlotSearch } from './components/AdSlotSearch';
import { AdSlotGrid } from './components/AdSlotGrid';
import { loadAdSense } from './lib/adLoader';
import { batchAPI } from './services/batchAPI';
import { useLanguage } from './context/LanguageContext';

const App: React.FC = () => {
  const { lang, setLang } = useLanguage();
  const t = TRANSLATIONS[lang];

  // Search State
  const [results, setResults] = useState<VideoResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Selection/Batch State
  const [selectedItems, setSelectedItems] = useState<SelectionItem[]>([]);
  const [batchFormat, setBatchFormat] = useState<VideoFormat>('mp3');
  const [batchQuality, setBatchQuality] = useState<VideoQuality>('320k');

  // Job/Modal State
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [legalModalType, setLegalModalType] = useState<LegalDocType | null>(null);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);

  useEffect(() => {
    document.title = `BatchTube | ${t.heroTitle}`;
  }, [t.heroTitle]);

  // Load AdSense if consent is accepted
  useEffect(() => {
    const consent = localStorage.getItem('bt_cookie_consent');
    if (consent === 'accepted') {
      loadAdSense();
    }
  }, []);

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
    if (!query.trim()) return;
    setIsSearching(true);
    setResults([]);
    try {
      const data = await api.search(query);
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelection = (video: VideoResult, format?: VideoFormat, quality?: VideoQuality) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.video.id === video.id);
      if (exists) {
        return prev.filter(i => i.video.id !== video.id);
      }
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
      const items = selectedItems.map(item => ({
        url: `https://www.youtube.com/watch?v=${item.video.id}`,
        title: item.video.title || undefined,
        thumbnail: item.video.thumbnail || `https://i.ytimg.com/vi/${item.video.id}/hqdefault.jpg`,
      }));

      const quality = batchFormat === 'mp3'
        ? '1080p'
        : (batchQuality === '4K' ? '4k' : '1080p');

      const { jobId } = await batchAPI.createJob({
        items,
        format: batchFormat,
        quality: batchFormat === 'mp4' ? quality : undefined
      });

      setActiveJobId(jobId);
    } catch (e) {
      console.error('Batch start failed', e);
      alert('Failed to start batch download. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050509] text-white font-sans selection:bg-primary/30 overflow-x-hidden">
      <Navbar lang={lang} setLang={setLang} />

      <main className="flex-grow pt-8 sm:pt-12 md:pt-16 pb-16 sm:pb-20 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Hero onSearch={handleSearch} loading={isSearching} t={t} />

        {/* Ad Slot: Below Search Bar */}
        {results.length > 0 && <AdSlotSearch />}

        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 animate-fadeIn">
          {results.map((video, index) => (
            <React.Fragment key={video.id}>
              <VideoCard
                video={video}
                isSelected={!!selectedItems.find(i => i.video.id === video.id)}
                onSelect={(format, quality) => toggleSelection(video, format, quality)}
                t={t}
              />
              {(index + 1) % 8 === 0 && (
                <AdSlotGrid index={Math.floor((index + 1) / 8)} />
              )}
            </React.Fragment>
          ))}
        </div>
      </main>

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

      <Footer onOpenLegal={setLegalModalType} t={t} />

      <SelectionModal
        isOpen={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        items={selectedItems}
        onRemove={handleRemoveFromSelection}
        t={t}
      />

      {activeJobId && (
        <ProgressModal
          jobId={activeJobId}
          onClose={() => setActiveJobId(null)}
          totalItems={selectedItems.length}
          t={t}
        />
      )}

      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
        t={t}
        lang={lang}
      />

      <CookieConsent t={t} />
    </div>
  );
};

export default App;
