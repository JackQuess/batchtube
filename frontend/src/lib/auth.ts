import { AuthUser } from '../types';
import { hasSupabaseConfig, supabase } from './supabaseClient';

const AUTH_STORAGE_KEY = 'batchtube_auth_user';
const ACCOUNT_STORAGE_KEY = 'batchtube_local_accounts';
const AUTH_TOKEN_STORAGE_KEY = 'batchtube_auth_token';

export const AUTH_CHANGE_EVENT = 'batchtube:auth-changed';

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

interface LocalAccount {
  id: string;
  email: string;
  password: string;
  createdAt: string;
}

const buildUserId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const readAccounts = (): LocalAccount[] => {
  return safeParse<LocalAccount[]>(localStorage.getItem(ACCOUNT_STORAGE_KEY), []);
};

const writeAccounts = (accounts: LocalAccount[]) => {
  localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accounts));
};

const writeUser = (user: AuthUser | null) => {
  if (!user) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } else {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  }
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

const writeAuthToken = (token: string | null) => {
  if (!token) {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    return;
  }
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
};

const readAuthToken = () => localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

export const getStoredUser = (): AuthUser | null => {
  return safeParse<AuthUser | null>(localStorage.getItem(AUTH_STORAGE_KEY), null);
};

const requireSupabase = () => {
  if (!hasSupabaseConfig || !supabase) {
    return null;
  }
  return supabase;
};

const toAuthUser = (user: { id: string; email?: string | null }): AuthUser => {
  return {
    id: user.id,
    email: user.email || '',
    plan: 'free'
  };
};

export const setStoredUser = (user: AuthUser) => {
  writeUser(user);
};

export const clearUser = () => {
  if (hasSupabaseConfig && supabase) {
    void supabase.auth.signOut();
  }
  writeAuthToken(null);
  writeUser(null);
};

export const registerWithEmail = async (email: string, password: string): Promise<AuthUser> => {
  const client = requireSupabase();
  const normalized = normalizeEmail(email);
  if (!client) {
    const accounts = readAccounts();
    if (accounts.some((account) => account.email === normalized)) {
      throw new Error('Bu e-posta zaten kayıtlı.');
    }
    const newAccount: LocalAccount = {
      id: buildUserId(),
      email: normalized,
      password,
      createdAt: new Date().toISOString()
    };
    writeAccounts([newAccount, ...accounts]);
    const user: AuthUser = { id: newAccount.id, email: newAccount.email, plan: 'free' };
    writeUser(user);
    return user;
  }
  const { data, error } = await client.auth.signUp({
    email: normalized,
    password
  });
  if (error) {
    throw new Error(error.message || 'Kayıt başarısız.');
  }
  if (!data.user) {
    throw new Error('Kayıt sırasında kullanıcı oluşturulamadı.');
  }
  const user = toAuthUser(data.user);
  writeAuthToken(data.session?.access_token ?? null);
  writeUser(user);
  return user;
};

export const loginWithEmail = async (email: string, password: string): Promise<AuthUser> => {
  const client = requireSupabase();
  const normalized = normalizeEmail(email);
  if (!client) {
    const account = readAccounts().find((row) => row.email === normalized);
    if (!account || account.password !== password) {
      throw new Error('E-posta veya şifre hatalı.');
    }
    const user: AuthUser = { id: account.id, email: account.email, plan: 'free' };
    writeUser(user);
    return user;
  }
  const { data, error } = await client.auth.signInWithPassword({
    email: normalized,
    password
  });
  if (error || !data.user) {
    throw new Error(error?.message || 'E-posta veya şifre hatalı.');
  }
  const user = toAuthUser(data.user);
  writeAuthToken(data.session?.access_token ?? null);
  writeUser(user);
  return user;
};

export const sendResetForEmail = async (email: string): Promise<boolean> => {
  const client = requireSupabase();
  const normalized = normalizeEmail(email);
  if (!client) {
    return readAccounts().some((account) => account.email === normalized);
  }
  const redirectTo = `${window.location.origin}/`;
  const { error } = await client.auth.resetPasswordForEmail(normalized, { redirectTo });
  if (error) {
    throw new Error(error.message || 'Sıfırlama bağlantısı gönderilemedi.');
  }
  return true;
};

export const initializeAuth = async (): Promise<AuthUser | null> => {
  if (!hasSupabaseConfig || !supabase) {
    return getStoredUser();
  }
  const sessionData = await supabase.auth.getSession();
  writeAuthToken(sessionData.data.session?.access_token ?? null);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    writeAuthToken(null);
    writeUser(null);
    return null;
  }
  const user = toAuthUser(data.user);
  writeUser(user);
  return user;
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = readAuthToken();
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`
  };
};
