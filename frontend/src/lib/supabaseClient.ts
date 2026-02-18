export interface SupabaseAuthUser {
  id: string;
  email: string;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: SupabaseAuthUser;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const STORAGE_KEY = 'batchtube_supabase_session';
const AUTH_EVENT = 'batchtube-auth-change';

const isConfigured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const authFetch = async (path: string, init: RequestInit = {}) => {
  if (!isConfigured()) {
    throw new Error('supabase_not_configured');
  }

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    ...(init.headers || {})
  } as Record<string, string>;

  const res = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    ...init,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.msg || data?.error_description || data?.error || 'auth_request_failed');
  }

  return data;
};

export const getStoredSession = (): SupabaseSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SupabaseSession;
    if (!parsed?.access_token || !parsed?.user?.id) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const setStoredSession = (session: SupabaseSession | null) => {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }
  window.dispatchEvent(new CustomEvent(AUTH_EVENT));
};

export const supabaseAuth = {
  isConfigured,
  authEvent: AUTH_EVENT,

  getSession: (): SupabaseSession | null => getStoredSession(),

  getUser: (): SupabaseAuthUser | null => {
    const session = getStoredSession();
    return session?.user || null;
  },

  signInWithPassword: async (email: string, password: string): Promise<SupabaseSession> => {
    const data = await authFetch('/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    const session = data as SupabaseSession;
    setStoredSession(session);
    return session;
  },

  signUp: async (email: string, password: string): Promise<SupabaseSession | null> => {
    const data = await authFetch('/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (data?.access_token && data?.user) {
      const session = data as SupabaseSession;
      setStoredSession(session);
      return session;
    }

    return null;
  },

  sendMagicLink: async (email: string, redirectTo?: string) => {
    await authFetch('/otp', {
      method: 'POST',
      body: JSON.stringify({ email, create_user: true, options: redirectTo ? { emailRedirectTo: redirectTo } : undefined })
    });
  },

  sendPasswordReset: async (email: string, redirectTo?: string) => {
    await authFetch('/recover', {
      method: 'POST',
      body: JSON.stringify({ email, redirect_to: redirectTo })
    });
  },

  signOut: () => {
    setStoredSession(null);
  },

  getAuthHeaders: (): Record<string, string> => {
    const session = getStoredSession();
    if (!session?.user?.id) return {};
    return {
      Authorization: `Bearer ${session.access_token}`,
      'x-user-id': session.user.id,
      'x-user-email': session.user.email || ''
    };
  }
};
