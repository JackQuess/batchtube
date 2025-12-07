import React, { useEffect, useRef } from 'react';

interface AdSlotGridProps {
  clientId?: string;
  index: number;
}

/**
 * AdSlotGrid - Native-style ad that fits in the video grid
 * Behaves like a video card but clearly labeled as "Ad"
 * Inserted after every 8th video card
 */
export const AdSlotGrid: React.FC<AdSlotGridProps> = ({ 
  clientId = 'ca-pub-XXXXXXXXXXXXXXXX',
  index 
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
          console.error('[AdSlotGrid] Error pushing ad:', err);
        }
      }
    };

    checkAdSense();
    const timer = setTimeout(checkAdSense, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className="bg-[#0b0b10] rounded-xl overflow-hidden border border-white/5 flex flex-col"
      style={{ gridColumn: 'span 1' }}
    >
      {/* Ad Label */}
      <div className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 text-center border-b border-white/5">
        AD
      </div>
      
      {/* Ad Container */}
      <div className="flex-1 p-2 min-h-[200px] flex items-center justify-center">
        <ins
          ref={adRef}
          className="adsbygoogle block"
          style={{ display: 'block', width: '100%', height: '100%', minHeight: '200px' }}
          data-ad-client={clientId}
          data-ad-slot="XXXXXXXXXX"
          data-ad-format="rectangle"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
};

