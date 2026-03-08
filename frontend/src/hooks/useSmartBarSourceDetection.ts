/**
 * SmartBar source detection hook.
 * Uses sourceDetection.detectSource() for classification; drives preview states and actions.
 */

import { useState, useCallback, useRef } from 'react';
import { detectSource, type DetectionResult, type SourceType } from '../lib/sourceDetection';

export type SmartBarSourceState =
  | 'idle'
  | 'typing'
  | 'detecting'
  | 'single_video'
  | 'multiple_links'
  | 'channel'
  | 'playlist'
  | 'profile'
  | 'command'
  | 'unsupported'
  | 'processing';

const DETECT_DEBOUNCE_MS = 400;

export interface UseSmartBarSourceDetectionOptions {
  onCommand?: (action: string, payload?: string) => void;
  onStartBatch?: (opts: { urls: string[]; format?: 'mp3' | 'mp4' | 'mkv'; quality?: 'best' | '720p' | '1080p' | '4k' }) => void;
  onStartArchive?: (opts: { sourceUrl: string; mode: 'latest_25' | 'latest_n' | 'all' | 'select'; latestN?: number }) => void;
  onOpenSourcePicker?: (url: string, provider: string, kind: 'channel' | 'playlist' | 'profile') => void;
  onOpenSourceSelection?: (url: string, type: 'channel' | 'playlist' | 'profile', provider: string, latestN?: number) => void;
}

function detectionTypeToState(type: SourceType): SmartBarSourceState {
  if (type === 'single_video') return 'single_video';
  if (type === 'multiple_links') return 'multiple_links';
  if (type === 'channel') return 'channel';
  if (type === 'playlist') return 'playlist';
  if (type === 'profile') return 'profile';
  if (type === 'command') return 'command';
  return 'unsupported';
}

export function useSmartBarSourceDetection(options: UseSmartBarSourceDetectionOptions = {}) {
  const [value, setValue] = useState('');
  const [state, setState] = useState<SmartBarSourceState>('idle');
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    setValue('');
    setState('idle');
    setDetection(null);
    setErrorMessage(null);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const runDetection = useCallback((overrideValue?: string) => {
    const raw = overrideValue !== undefined ? overrideValue : value;
    const trimmed = raw.trim();
    if (!trimmed) {
      setState('idle');
      setDetection(null);
      setErrorMessage(null);
      return;
    }

    setState('detecting');
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      const result = detectSource(trimmed);
      setDetection(result);
      const nextState = detectionTypeToState(result.type);
      setState(nextState);
      if (result.type === 'unsupported') {
        setErrorMessage('Unsupported or invalid link');
      } else {
        setErrorMessage(null);
      }
    }, DETECT_DEBOUNCE_MS);
  }, [value]);

  /** Run detection synchronously (e.g. when user presses Enter before debounce). */
  const runDetectionSync = useCallback((input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const result = detectSource(trimmed);
    setDetection(result);
    const nextState = detectionTypeToState(result.type);
    setState(nextState);
    if (result.type === 'unsupported') {
      setErrorMessage('Unsupported or invalid link');
    } else {
      setErrorMessage(null);
    }
    return result;
  }, []);

  const handleChange = useCallback(
    (next: string) => {
      setValue(next);
      setErrorMessage(null);
      if (next.trim()) {
        setState('typing');
        const trimmed = next.trim();
        const looksLikeSingleUrl = /^https?:\/\/[^\s]+$/i.test(trimmed) || (/^[^\s]+$/i.test(trimmed) && trimmed.includes('.'));
        if (looksLikeSingleUrl) {
          runDetectionSync(trimmed);
        } else {
          runDetection(trimmed);
        }
      } else {
        setState('idle');
        setDetection(null);
      }
    },
    [runDetection, runDetectionSync]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed) return;

      let effectiveDetection = detection;
      if (!effectiveDetection || state === 'typing' || state === 'detecting') {
        effectiveDetection = runDetectionSync(trimmed) ?? undefined;
      }
      if (!effectiveDetection) return;

      if (effectiveDetection.type === 'single_video' && effectiveDetection.url) {
        options.onStartBatch?.({ urls: [effectiveDetection.url] });
        clear();
        return;
      }
      if (effectiveDetection.type === 'multiple_links' && effectiveDetection.uniqueUrls && effectiveDetection.uniqueUrls.length > 0) {
        options.onStartBatch?.({ urls: effectiveDetection.uniqueUrls });
        clear();
        return;
      }
      if ((effectiveDetection.type === 'channel' || effectiveDetection.type === 'playlist' || effectiveDetection.type === 'profile') && effectiveDetection.sourceUrl) {
        options.onOpenSourcePicker?.(effectiveDetection.sourceUrl, effectiveDetection.provider ?? 'generic', effectiveDetection.type);
        clear();
        return;
      }
      if (effectiveDetection.type === 'command' && effectiveDetection.suggestions?.[0]) {
        const first = effectiveDetection.suggestions[0];
        if (first.action === 'history' || first.action === 'files') {
          options.onCommand?.(first.action);
        } else if (first.action === 'latest' && first.payload) {
          options.onOpenSourceSelection?.(first.payload, 'channel', effectiveDetection.provider ?? 'youtube', effectiveDetection.latestN);
        } else if (first.action === 'archive' && first.payload && options.onStartArchive) {
          options.onStartArchive({
            sourceUrl: first.payload,
            mode: effectiveDetection.archiveMode ?? 'latest_25',
            latestN: effectiveDetection.archiveLatestN
          });
        } else if (first.action === 'archive' && first.payload) {
          options.onOpenSourcePicker?.(first.payload, effectiveDetection.provider ?? 'generic', 'channel');
        } else if (first.payload) {
          options.onStartBatch?.({ urls: [first.payload] });
        }
        clear();
        return;
      }
      runDetection(trimmed);
    },
    [value, detection, state, options, clear, runDetection, runDetectionSync]
  );

  const startProcessing = useCallback(() => {
    setState('processing');
  }, []);

  const setError = useCallback((msg: string | null) => {
    setState(msg ? 'unsupported' : 'idle');
    setErrorMessage(msg);
  }, []);

  const isPreviewVisible =
    state === 'single_video' ||
    state === 'multiple_links' ||
    state === 'channel' ||
    state === 'playlist' ||
    state === 'profile' ||
    state === 'command';

  return {
    value,
    setValue: handleChange,
    state,
    detection,
    errorMessage,
    clear,
    handleSubmit,
    startProcessing,
    setError,
    isPreviewVisible
  };
}

export type { DetectionResult, SourceType } from '../lib/sourceDetection';
