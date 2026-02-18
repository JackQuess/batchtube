import React, { useEffect, useState } from 'react';

function normalizePath(path: string): string {
  const clean = (path || '/');
  const pathname = clean.split('?')[0].split('#')[0];
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname || '/';
}

function normalizeUrl(path: string): string {
  const clean = (path || '/').split('#')[0];
  const [rawPathname, rawSearch = ''] = clean.split('?');
  const pathname = normalizePath(rawPathname || '/');
  const search = rawSearch ? `?${rawSearch}` : '';
  return `${pathname}${search}`;
}

export function getCurrentPathWithSearch(): string {
  return `${normalizePath(window.location.pathname)}${window.location.search || ''}`;
}

export function useSearch(): string {
  const [search, setSearch] = useState(() => window.location.search || '');

  useEffect(() => {
    const handler = () => setSearch(window.location.search || '');
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  return search;
}

export function getSearchParam(search: string, key: string): string | null {
  const params = new URLSearchParams(search || '');
  return params.get(key);
}

export function navigate(to: string, options?: { replace?: boolean }) {
  const next = normalizeUrl(to);
  const current = normalizeUrl(`${window.location.pathname}${window.location.search || ''}`);
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
