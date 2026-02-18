import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export function RequireAuth({ children }: { children: ReactElement }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'unauthorized'>('loading');

  useEffect(() => {
    apiFetch<{ ok: boolean }>('/admin-api/health')
      .then(() => setStatus('ok'))
      .catch(() => setStatus('unauthorized'));
  }, []);

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center text-gray-400">Checking session...</div>;
  }

  if (status === 'unauthorized') {
    return <Navigate to="/login" replace />;
  }

  return children;
}
