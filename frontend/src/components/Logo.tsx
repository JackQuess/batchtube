import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "size-8" }) => (
  <div className={`text-primary ${className}`}>
    <svg className="w-full h-full" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
    </svg>
  </div>
);