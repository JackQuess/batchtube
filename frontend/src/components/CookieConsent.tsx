import React, { useState, useEffect } from 'react';
import { Translations } from '../types';
import { loadAdSense } from '../lib/adLoader';

export type CookieConsentStatus = 'accepted' | 'rejected' | 'essential' | null;

const STORAGE_KEY = 'bt_cookie_consent';

export function useCookieConsent(): CookieConsentStatus {
  const [consent, setConsent] = useState<CookieConsentStatus>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as CookieConsentStatus;
    setConsent(stored || null);
  }, []);

  return consent;
}

interface CookieConsentProps {
  t: Translations;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ t }) => {
  const [show, setShow] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      setShow(true);
      setTimeout(() => setIsVisible(true), 10);
    } else {
      if (consent === 'accepted') {
        loadAdSense();
      }
    }
  }, []);

  const handleConsent = (status: 'accepted' | 'rejected' | 'essential') => {
    localStorage.setItem(STORAGE_KEY, status);
    setShow(false);
    setIsVisible(false);

    if (status === 'accepted') {
      loadAdSense();
    }
  };

  if (!show) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-[60] max-w-md transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="bg-black/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/10 p-4">
        <p className="text-sm text-gray-300 mb-4 leading-relaxed">
          {t.cookie.message}
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleConsent('accepted')}
            className="px-4 py-2 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors"
          >
            {t.cookie.accept}
          </button>

          <button
            onClick={() => handleConsent('rejected')}
            className="px-4 py-2 rounded-full bg-white/10 text-gray-300 text-xs font-medium hover:bg-white/20 transition-colors"
          >
            {t.cookie.reject}
          </button>

          <button
            onClick={() => handleConsent('essential')}
            className="px-4 py-2 rounded-full bg-white/5 text-gray-400 text-xs font-medium hover:bg-white/10 transition-colors"
          >
            {t.cookie.essential}
          </button>
        </div>
      </div>
    </div>
  );
};
