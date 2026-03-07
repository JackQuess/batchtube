/**
 * SmartBar state machine and parsed result.
 * States: idle | typing | detecting | single_preview | multi_preview | channel_preview | command_suggestions | processing | error
 */

import { useState, useCallback, useRef } from 'react';
import {
  parseSmartBarInput,
  type ParsedResult,
  type ParsedSingle,
  type ParsedMulti,
  type ParsedChannel,
  type ParsedCommand
} from '../lib/smartBarParser';

export type SmartBarState =
  | 'idle'
  | 'typing'
  | 'detecting'
  | 'single_preview'
  | 'multi_preview'
  | 'channel_preview'
  | 'command_suggestions'
  | 'processing'
  | 'error';

const DETECT_DEBOUNCE_MS = 400;

export interface UseSmartBarOptions {
  onCommand?: (action: string, payload?: string) => void;
  onSubmitSingle?: (url: string, provider: string) => void;
  onSubmitMulti?: (urls: string[]) => void;
  onSubmitChannel?: (url: string, provider: string, kind: 'channel' | 'playlist' | 'profile') => void;
}

export function useSmartBar(options: UseSmartBarOptions = {}) {
  const [value, setValue] = useState('');
  const [state, setState] = useState<SmartBarState>('idle');
  const [parsed, setParsed] = useState<ParsedResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    setValue('');
    setState('idle');
    setParsed(null);
    setErrorMessage(null);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const runDetection = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      setState('idle');
      setParsed(null);
      return;
    }

    setState('detecting');
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      const result = parseSmartBarInput(trimmed);

      if (!result) {
        setState('typing');
        setParsed(null);
        return;
      }

      if (result.kind === 'invalid') {
        setState('error');
        setParsed(null);
        setErrorMessage('Invalid or unsupported link');
        return;
      }

      setParsed(result);
      setErrorMessage(null);

      if (result.kind === 'single') setState('single_preview');
      else if (result.kind === 'multi') setState('multi_preview');
      else if (result.kind === 'channel' || result.kind === 'playlist' || result.kind === 'profile') setState('channel_preview');
      else if (result.kind === 'command') setState('command_suggestions');
      else setState('idle');
    }, DETECT_DEBOUNCE_MS);
  }, [value]);

  const handleChange = useCallback(
    (next: string) => {
      setValue(next);
      setErrorMessage(null);
      if (next.trim()) {
        setState('typing');
        runDetection();
      } else {
        setState('idle');
        setParsed(null);
      }
    },
    [runDetection]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed) return;

      if (state === 'single_preview' && parsed && parsed.kind === 'single') {
        options.onSubmitSingle?.(parsed.url, parsed.provider);
        return;
      }
      if (state === 'multi_preview' && parsed && parsed.kind === 'multi' && parsed.uniqueUrls.length > 0) {
        options.onSubmitMulti?.(parsed.uniqueUrls);
        return;
      }
      if ((state === 'channel_preview') && parsed && (parsed.kind === 'channel' || parsed.kind === 'playlist' || parsed.kind === 'profile')) {
        options.onSubmitChannel?.(parsed.url, parsed.provider, parsed.kind);
        return;
      }
      if (state === 'command_suggestions' && parsed && parsed.kind === 'command') {
        const first = parsed.suggestions[0];
        if (first) options.onCommand?.(first.action, first.payload);
        return;
      }

      runDetection();
    },
    [value, state, parsed, options, runDetection]
  );

  const startProcessing = useCallback(() => {
    setState('processing');
  }, []);

  const setError = useCallback((msg: string | null) => {
    setState(msg ? 'error' : 'idle');
    setErrorMessage(msg);
  }, []);

  return {
    value,
    setValue: handleChange,
    state,
    parsed,
    errorMessage,
    clear,
    handleSubmit,
    startProcessing,
    setError,
    isPreviewVisible:
      state === 'single_preview' ||
      state === 'multi_preview' ||
      state === 'channel_preview' ||
      state === 'command_suggestions'
  };
}

export type { ParsedResult, ParsedSingle, ParsedMulti, ParsedChannel, ParsedCommand } from '../lib/smartBarParser';
