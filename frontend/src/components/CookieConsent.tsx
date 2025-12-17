
import React, { useState, useEffect } from 'react';
import { Translations } from '../types';

export type CookieConsentStatus = 'accepted' | 'rejected' | 'essential' | null;

const STORAGE_KEY = 'bt_cookie_consent';
const CONSENT_CHANGED_EVENT = 'bt_cookie_consent_changed';

export function useCookieConsent(): CookieConsentStatus {
  const [consent, setConsent] = useState<CookieConsentStatus>(null);

  useEffect(() => {
    const read = () => {
      const stored = localStorage.getItem(STORAGE_KEY) as CookieConsentStatus;
      setConsent(stored || null);
    };
    read();

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) read();
    };
    const onCustom = () => read();

    window.addEventListener('storage', onStorage);
    window.addEventListener(CONSENT_CHANGED_EVENT, onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(CONSENT_CHANGED_EVENT, onCustom);
    };
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
      // Trigger fade-in animation
      setTimeout(() => setIsVisible(true), 10);
    }
  }, []);

  const handleConsent = (status: 'accepted' | 'rejected' | 'essential') => {
    localStorage.setItem(STORAGE_KEY, status);
    window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
    setShow(false);
    setIsVisible(false);
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
