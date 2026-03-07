import React, { useId } from 'react';

interface BatchTubeLogoProps {
  size?: 'sm' | 'md' | 'lg';
  textClassName?: string;
}

const sizeMap = {
  sm: { box: 'w-7 h-6', svg: 'w-5 h-4', text: 'text-sm' },
  md: { box: 'w-9 h-8', svg: 'w-6 h-5', text: 'text-lg' },
  lg: { box: 'w-11 h-10', svg: 'w-8 h-6', text: 'text-xl' },
};

/** App primary red (Tailwind app-primary / app-primary-hover). */
const RED = '#E11D48';
const RED_LIGHT = '#F43F5E';
const RED_DARK = '#BE123C';

/**
 * BatchTube logo: L-shaped block (tetromino) that evokes batches/modular processing.
 * Matches the site’s visual identity so the block instantly recalls BatchTube.
 */
export function BatchTubeLogo({ size = 'md', textClassName = '' }: BatchTubeLogoProps) {
  const id = useId().replace(/:/g, '');
  const { box, svg, text } = sizeMap[size];
  return (
    <>
      <div
        className={`${box} shrink-0 flex items-center justify-center transition-transform hover:scale-[1.04]`}
        aria-hidden
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className={`${svg} rotate-180`}
          role="img"
          aria-label="BatchTube"
        >
          {/* L-block: 2 squares left column, 1 square top-right, touching. */}
          <defs>
            <linearGradient id={`bt-block-top-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={RED_LIGHT} />
              <stop offset="100%" stopColor={RED} />
            </linearGradient>
            <linearGradient id={`bt-block-mid-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={RED} />
              <stop offset="100%" stopColor={RED_DARK} />
            </linearGradient>
            <linearGradient id={`bt-block-right-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={RED_LIGHT} />
              <stop offset="100%" stopColor={RED_DARK} />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="10" height="10" rx="1" fill={`url(#bt-block-top-${id})`} />
          <rect x="0" y="10" width="10" height="10" rx="1" fill={`url(#bt-block-mid-${id})`} />
          <rect x="10" y="0" width="10" height="10" rx="1" fill={`url(#bt-block-right-${id})`} />
        </svg>
      </div>
      <span className={`text-white font-bold tracking-tight ${text} ${textClassName}`}>
        BatchTube
      </span>
    </>
  );
}
