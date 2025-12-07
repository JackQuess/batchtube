import React, { useEffect, useRef } from 'react';

interface AdSlotModalProps {
  clientId?: string;
}

/**
 * AdSlotModal - Ad container at the bottom of the download modal
 * 300x250 or responsive block ad, centered horizontally
 * Does not affect download progress items
 */
export const AdSlotModal: React.FC<AdSlotModalProps> = ({ 
  clientId = 'ca-pub-XXXXXXXXXXXXXXXX' 
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const isPushed = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkAdSense = () => {
      if ((window as any).adsbygoogle && !isPushed.current && adRef.current) {
        try {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          isPushed.current = true;
        } catch (err) {
          console.error('[AdSlotModal] Error pushing ad:', err);
        }
      }
    };

    checkAdSense();
    const timer = setTimeout(checkAdSense, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full flex justify-center py-4 border-t border-white/5 mt-4">
      <div className="w-full max-w-[300px]">
        <ins
          ref={adRef}
          className="adsbygoogle block"
          style={{ display: 'block', width: '100%', minHeight: '250px' }}
          data-ad-client={clientId}
          data-ad-slot="XXXXXXXXXX"
          data-ad-format="rectangle"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
};

