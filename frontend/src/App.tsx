
import React, { useState, useEffect } from 'react';
import { VideoResult, VideoFormat, SupportedLanguage, SelectionItem, LegalDocType, VideoQuality } from './types';
import { TRANSLATIONS } from './constants';
import { api } from './services/apiService';

import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { VideoCard } from './components/VideoCard';
import { SelectionBar } from './components/SelectionBar';
import { SelectionModal } from './components/SelectionModal';
import { DownloadModal } from './components/DownloadModal';
import { LegalModal } from './components/LegalModal';
import { Footer } from './components/Footer';
import { CookieConsent } from './components/CookieConsent';
import { loadAdSense } from './lib/adLoader';

const App: React.FC = () => {
  // Global State
  const [lang, setLang] = useState<SupportedLanguage>('en');
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
  }, [lang, t.heroTitle]);

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
      const { jobId } = await api.startBatchDownload(selectedItems);
      setActiveJobId(jobId);
    } catch (e) {
      console.error("Batch start failed", e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050509] text-white font-sans selection:bg-primary/30">
      
      <Navbar lang={lang} setLang={setLang} />
      
      <main className="flex-grow pt-20 pb-24 w-full max-w-7xl mx-auto">
        <Hero onSearch={handleSearch} loading={isSearching} t={t} />

        <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fadeIn">
          {results.map(video => (
            <VideoCard
              key={video.id}
              video={video}
              isSelected={!!selectedItems.find(i => i.video.id === video.id)}
              onSelect={(format, quality) => toggleSelection(video, format, quality)}
              t={t}
            />
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
        <DownloadModal 
          jobId={activeJobId} 
          onClose={() => setActiveJobId(null)} 
          t={t}
          initialItemCount={selectedItems.length}
        />
      )}

      <LegalModal 
        type={legalModalType} 
        onClose={() => setLegalModalType(null)} 
        t={t}
      />

      <CookieConsent t={t} />
    </div>
  );
};

export default App;
