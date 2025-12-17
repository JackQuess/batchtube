import React, { useEffect, useState } from 'react';

function normalizePath(path: string): string {
  const clean = (path || '/').split('?')[0].split('#')[0];
  if (clean.length > 1 && clean.endsWith('/')) return clean.slice(0, -1);
  return clean || '/';
}

export function navigate(to: string, options?: { replace?: boolean }) {
  const next = normalizePath(to);
  const current = normalizePath(window.location.pathname);
  if (next === current) return;

  if (options?.replace) {
    window.history.replaceState({}, '', next);
  } else {
    window.history.pushState({}, '', next);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function usePathname(): string {
  const [pathname, setPathname] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const handler = () => setPathname(normalizePath(window.location.pathname));
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  return pathname;
}

export const AppLink: React.FC<
  React.PropsWithChildren<{
    to: string;
    className?: string;
    onClick?: () => void;
  }>
> = ({ to, className, onClick, children }) => {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (
          e.defaultPrevented ||
          e.button !== 0 ||
          e.metaKey ||
          e.altKey ||
          e.ctrlKey ||
          e.shiftKey
        ) {
          return;
        }
        e.preventDefault();
        onClick?.();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
};

