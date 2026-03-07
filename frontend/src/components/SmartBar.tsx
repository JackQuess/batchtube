import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Command, Loader2, List, History, X, ClipboardPaste } from 'lucide-react';
import { ModalType } from '../types';
import { useSmartBarSourceDetection } from '../hooks/useSmartBarSourceDetection';
import { fetchLatestItemUrls } from '../lib/sourceItemsAdapter';
import { getSmartBarHintText } from '../lib/providerDisplay';
import { SingleVideoPreview } from './SmartBarPreviews/SingleVideoPreview';
import { MultiLinkPreview } from './SmartBarPreviews/MultiLinkPreview';
import { ChannelPlaylistProfilePreview } from './SmartBarPreviews/ChannelPlaylistProfilePreview';
import { CommandInterpretationPreview } from './SmartBarPreviews/CommandInterpretationPreview';

interface SmartBarProps {
  onCommand: (cmd: string, type: ModalType) => void;
  onStartProcessing: () => void;
  onOpenSourcePicker?: (url: string, provider: string, kind: 'channel' | 'playlist' | 'profile') => void;
  onStartBatch?: (opts: { urls: string[]; format?: 'mp3' | 'mp4'; quality?: '1080p' | '4k' }) => void;
}

function QuickAction({
  icon: Icon,
  label,
  shortcut,
  onClick
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group"
    >
      <div className="flex items-center gap-3 text-app-muted group-hover:text-white transition-colors">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-1 text-[10px] font-medium text-app-muted/50 bg-white/5 px-2 py-1 rounded-md">
        <Command className="w-3 h-3" />
        <span>{shortcut}</span>
      </div>
    </button>
  );
}

export function SmartBar({ onCommand, onStartProcessing, onOpenSourcePicker, onStartBatch }: SmartBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    value,
    setValue,
    state,
    detection,
    errorMessage,
    clear,
    handleSubmit,
    startProcessing,
    isPreviewVisible
  } = useSmartBarSourceDetection({
    onCommand: (action) => {
      if (action === 'history') onCommand('history', 'history');
      else if (action === 'files') onCommand('files', 'files');
      else startProcessing();
    },
    onStartBatch: (opts) => {
      if (opts.urls.length > 0) {
        onStartBatch?.(opts);
        clear();
      } else startProcessing();
    },
    onOpenSourcePicker: (url, provider, kind) => {
      onOpenSourcePicker?.(url, provider, kind);
      clear();
    },
    onOpenSourceSelection: async (url, type, _provider, latestN) => {
      const n = latestN ?? 10;
      const urls = await fetchLatestItemUrls(url, type, n);
      if (urls.length > 0) {
        onStartBatch?.({ urls });
      } else {
        onStartBatch?.({ urls: [url] });
      }
      clear();
    }
  });

  const [clipboardHasLink, setClipboardHasLink] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const checkClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();
      if (!trimmed) {
        setClipboardHasLink(false);
        return;
      }
      const looksLikeUrl = /https?:\/\//i.test(trimmed) || /^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(trimmed) || trimmed.split(/[\s,]+/).some((part) => /https?:\/\//i.test(part));
      setClipboardHasLink(looksLikeUrl);
    } catch {
      setClipboardHasLink(false);
    }
  }, []);

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) setValue(text.trim());
      setClipboardHasLink(false);
      inputRef.current?.focus();
    } catch {
      setClipboardHasLink(false);
    }
  }, [setValue]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const text = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text');
    if (text && text.trim()) {
      setValue(text.trim());
      inputRef.current?.focus();
    }
  }, [setValue]);

  useEffect(() => {
    const onFocus = () => {
      if (!value.trim()) void checkClipboard();
    };
    const el = inputRef.current;
    el?.addEventListener('focus', onFocus);
    return () => el?.removeEventListener('focus', onFocus);
  }, [value, checkClipboard]);

  const isFocused = state === 'typing' || state === 'detecting' || isPreviewVisible;
  const isLoading = state === 'detecting' || state === 'processing';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAction = () => {
    clear();
    onStartProcessing();
  };

  const handleSingleDownload = () => {
    if (detection?.type === 'single_video' && detection.url && onStartBatch) {
      onStartBatch({ urls: [detection.url] });
      clear();
    } else {
      handleAction();
    }
  };

  const handleMultiBatch = () => {
    if (detection?.type === 'multiple_links' && detection.uniqueUrls && detection.uniqueUrls.length > 0 && onStartBatch) {
      onStartBatch({ urls: detection.uniqueUrls });
      clear();
    } else {
      handleAction();
    }
  };

  const handleDownloadLatest = useCallback(async (n: number) => {
    if (detection?.type !== 'channel' && detection?.type !== 'playlist' && detection?.type !== 'profile' || !detection.sourceUrl || !onStartBatch) {
      handleAction();
      return;
    }
    const urls = await fetchLatestItemUrls(detection.sourceUrl, detection.type, n);
    if (urls.length > 0) {
      onStartBatch({ urls });
    } else {
      onStartBatch({ urls: [detection.sourceUrl] });
    }
    clear();
  }, [detection, onStartBatch, clear]);

  const handleDownloadAllSource = () => {
    if (detection?.type === 'channel' || detection?.type === 'playlist' || detection?.type === 'profile') {
      if (detection.sourceUrl && onStartBatch) {
        onStartBatch({ urls: [detection.sourceUrl] });
        clear();
      } else handleAction();
    } else handleAction();
  };

  const handleCommandSuggestion = useCallback((action: string, payload?: string) => {
    if (action === 'history') onCommand('history', 'history');
    else if (action === 'files') onCommand('files', 'files');
    else if (action === 'latest' && payload && detection?.latestN != null) {
      void fetchLatestItemUrls(payload, 'channel', detection.latestN).then((urls) => {
        if (urls.length > 0) onStartBatch?.({ urls });
        else onStartBatch?.({ urls: [payload] });
        clear();
      });
    } else if (payload && onStartBatch) {
      onStartBatch({ urls: [payload] });
      clear();
    } else handleAction();
  }, [onCommand, onStartBatch, detection?.latestN, clear]);

  return (
    <div className="w-full max-w-2xl mx-auto relative z-20 flex flex-col items-center justify-center mt-[20vh] transition-all duration-500">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full glass-panel rounded-2xl transition-all duration-300 ${isFocused || isPreviewVisible ? 'shadow-[0_0_40px_rgba(225,29,72,0.15)] border-app-primary/30 bg-black/80' : 'shadow-2xl bg-black/40'} ${isDragOver ? 'ring-2 ring-app-primary/50 ring-offset-2 ring-offset-transparent' : ''}`}
      >
        <form onSubmit={handleSubmit} className="relative flex items-center px-6 py-4">
          {isLoading ? (
            <Loader2 className="w-5 h-5 mr-4 text-app-primary animate-spin shrink-0" />
          ) : (
            <Search className={`w-5 h-5 mr-4 shrink-0 transition-colors ${isFocused || isPreviewVisible ? 'text-app-primary' : 'text-app-muted'}`} />
          )}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => {}}
            onBlur={() => {}}
            disabled={isLoading}
            placeholder="Paste links, channels, or type a command..."
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-lg text-white placeholder-app-muted/60 disabled:opacity-50"
          />
          {isPreviewVisible && (
            <button
              type="button"
              onClick={() => {
                clear();
                inputRef.current?.focus();
              }}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors ml-2 shrink-0"
            >
              <X className="w-4 h-4 text-app-muted hover:text-white" />
            </button>
          )}
          {!isPreviewVisible && (
            <div className="flex items-center gap-1 text-xs text-app-muted/50 bg-white/5 px-2 py-1 rounded-md ml-4 shrink-0">
              <Command className="w-3 h-3" />
              <span>⌘K</span>
            </div>
          )}
        </form>

        {errorMessage && (
          <div className="px-6 pb-3">
            <p className="text-xs text-red-400">{errorMessage}</p>
          </div>
        )}

        <AnimatePresence>
          {isFocused && !value.trim() && !isPreviewVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-app-border/50"
            >
              <div className="p-2">
                {clipboardHasLink && (
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-left group mb-1 border border-app-primary/20 bg-app-primary/5"
                  >
                    <ClipboardPaste className="w-4 h-4 text-app-primary" />
                    <span className="text-sm font-medium text-app-primary">Link detected — Paste into SmartBar</span>
                  </button>
                )}
                <div className="px-4 py-2 text-[10px] font-semibold text-app-muted/50 uppercase tracking-widest">Quick Actions</div>
                <div className="flex flex-col gap-1">
                  <QuickAction
                    icon={List}
                    label="Batch from URLs"
                    shortcut="B"
                    onClick={() => {
                      setValue('https://youtube.com/watch?v=1, https://tiktok.com/@user/video/2');
                    }}
                  />
                  <QuickAction icon={History} label="Recent Downloads" shortcut="H" onClick={() => onCommand('history', 'history')} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {state === 'single_video' && detection?.type === 'single_video' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <SingleVideoPreview
                detection={detection}
                onDownload={handleSingleDownload}
                onAddToBatch={handleSingleDownload}
              />
            </motion.div>
          )}
          {state === 'multiple_links' && detection?.type === 'multiple_links' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <MultiLinkPreview
                detection={detection}
                onDownloadAll={handleMultiBatch}
                onCreateBatch={handleMultiBatch}
              />
            </motion.div>
          )}
          {(state === 'channel' || state === 'playlist' || state === 'profile') && detection && (detection.type === 'channel' || detection.type === 'playlist' || detection.type === 'profile') && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <ChannelPlaylistProfilePreview
                detection={detection}
                onDownloadLatest={handleDownloadLatest}
                onDownloadAll={handleDownloadAllSource}
                onSelectManually={() => {
                  if (detection.sourceUrl) onOpenSourcePicker?.(detection.sourceUrl, detection.provider ?? 'generic', detection.type);
                }}
              />
            </motion.div>
          )}
          {state === 'command' && detection?.type === 'command' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <CommandInterpretationPreview
                detection={detection}
                onSuggestion={handleCommandSuggestion}
                onCancel={clear}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence mode="wait">
        {!isFocused && !isPreviewVisible && (
          <motion.div
            key="unfocused"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-6 text-sm text-app-muted/50 font-medium tracking-wide"
          >
            {getSmartBarHintText()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
