
const STORAGE_KEY = 'bt_cookie_consent';

export function loadAdSense() {
  // Check if consent is accepted
  const consent = localStorage.getItem(STORAGE_KEY);
  if (consent !== 'accepted') {
    console.log('[AdSense] Consent not accepted, skipping ad load');
    return;
  }

  // Check if already loaded
  if (document.getElementById('adsense-script')) {
    console.log('[AdSense] Already loaded');
    return;
  }

  console.log('[AdSense] Loading AdSense script...');

  // Load AdSense script
  const script = document.createElement('script');
  script.id = 'adsense-script';
  script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX';
  script.async = true;
  script.crossOrigin = 'anonymous';
  
  script.onload = () => {
    console.log('[AdSense] Script loaded successfully');
  };

  script.onerror = () => {
    console.error('[AdSense] Failed to load script');
  };

  document.head.appendChild(script);
}

export function resetCookieConsent() {
  localStorage.removeItem(STORAGE_KEY);
  // Remove AdSense script if exists
  const script = document.getElementById('adsense-script');
  if (script) {
    script.remove();
  }
  // Reload page
  window.location.reload();
}

