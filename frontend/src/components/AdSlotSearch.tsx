import React, { useEffect, useRef } from 'react';

interface AdSlotSearchProps {
  clientId?: string;
}

/**
 * AdSlotSearch - Ad container below the search bar
 * Responsive, full-width container with auto-sized ad
 */
export const AdSlotSearch: React.FC<AdSlotSearchProps> = ({ 
  clientId = 'ca-pub-XXXXXXXXXXXXXXXX' 
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const isPushed = useRef(false);

  useEffect(() => {
    // Check if AdSense script is loaded
    if (typeof window === 'undefined') return;
    
    const checkAdSense = () => {
      if ((window as any).adsbygoogle && !isPushed.current && adRef.current) {
        try {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          isPushed.current = true;
        } catch (err) {
          console.error('[AdSlotSearch] Error pushing ad:', err);
        }
      }
    };

    // Check immediately
    checkAdSense();

    // Also check after a delay in case script loads later
    const timer = setTimeout(checkAdSense, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full flex justify-center my-6 sm:my-8">
      <div className="w-full max-w-4xl px-4">
        <ins
          ref={adRef}
          className="adsbygoogle block"
          style={{ display: 'block', textAlign: 'center' }}
          data-ad-client={clientId}
          data-ad-slot="XXXXXXXXXX"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
};

