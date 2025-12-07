
import React, { useState, useEffect } from 'react';
import { VideoResult, VideoFormat, SupportedLanguage, SelectionItem, LegalDocType, VideoQuality } from './types';
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
import { loadAdSense } from './lib/adLoader';
import { batchAPI } from './services/batchAPI';

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
      // Map to new API format
      const items = selectedItems.map(item => ({
        url: `https://www.youtube.com/watch?v=${item.video.id}`,
        title: item.video.title || 'Unknown',
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
      alert('Failed to start batch download. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050509] text-white font-sans selection:bg-primary/30 overflow-x-hidden">
      
      <Navbar lang={lang} setLang={setLang} />
      
      <main className="flex-grow pt-16 sm:pt-20 pb-20 sm:pb-24 w-full max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <Hero onSearch={handleSearch} loading={isSearching} t={t} />

        <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 animate-fadeIn">
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
        <ProgressModal 
          jobId={activeJobId} 
          onClose={() => setActiveJobId(null)} 
          totalItems={selectedItems.length}
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
