
const STORAGE_KEY = 'bt_cookie_consent';

const DEFAULT_CLIENT_ID = 'ca-pub-XXXXXXXXXX';

export function loadAdSense(options?: { clientId?: string }) {
  const clientId = options?.clientId || import.meta.env.VITE_ADSENSE_CLIENT_ID || DEFAULT_CLIENT_ID;

  // Check if consent is accepted (strict: do not load at all without consent)
  const consent = localStorage.getItem(STORAGE_KEY);
  if (consent !== 'accepted') return;

  // Check if already loaded
  if (document.getElementById('adsense-script')) {
    return;
  }

  // Load AdSense script
  const script = document.createElement('script');
  script.id = 'adsense-script';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
  script.async = true;
  script.crossOrigin = 'anonymous';
  
  script.onload = () => {
    // no-op
  };

  script.onerror = () => {
    // no-op
  };

  document.head.appendChild(script);
}

export function getCookieConsent(): 'accepted' | 'rejected' | null {
  const value = localStorage.getItem(STORAGE_KEY);
  if (value === 'accepted' || value === 'rejected') {
    return value;
  }
  return null;
}

export function setCookieConsent(value: 'accepted' | 'rejected') {
  localStorage.setItem(STORAGE_KEY, value);
}

export function unloadAdSense() {
  const script = document.getElementById('adsense-script');
  if (script) script.remove();
}

export function resetCookieConsent() {
  localStorage.removeItem(STORAGE_KEY);
  // Remove AdSense script if exists
  unloadAdSense();
  // Reload page
  window.location.reload();
}
