import { AuthUser } from '../types';

const AUTH_STORAGE_KEY = 'batchtube_auth_user';
const ACCOUNT_STORAGE_KEY = 'batchtube_local_accounts';

export const AUTH_CHANGE_EVENT = 'batchtube:auth-changed';

interface LocalAccount {
  id: string;
  email: string;
  password: string;
  createdAt: string;
}

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const buildUserId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

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

export const getStoredUser = (): AuthUser | null => {
  return safeParse<AuthUser | null>(localStorage.getItem(AUTH_STORAGE_KEY), null);
};

export const setStoredUser = (user: AuthUser) => {
  writeUser(user);
};

export const clearUser = () => {
  writeUser(null);
};

export const registerWithEmail = (email: string, password: string): AuthUser => {
  const normalized = normalizeEmail(email);
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

  const user: AuthUser = {
    id: newAccount.id,
    email: newAccount.email,
    plan: 'free'
  };

  writeUser(user);
  return user;
};

export const loginWithEmail = (email: string, password: string): AuthUser => {
  const normalized = normalizeEmail(email);
  const account = readAccounts().find((row) => row.email === normalized);

  if (!account || account.password !== password) {
    throw new Error('E-posta veya şifre hatalı.');
  }

  const user: AuthUser = {
    id: account.id,
    email: account.email,
    plan: 'free'
  };

  writeUser(user);
  return user;
};

export const sendResetForEmail = (email: string): boolean => {
  const normalized = normalizeEmail(email);
  const exists = readAccounts().some((account) => account.email === normalized);
  return exists;
};

export const getAuthHeaders = (): Record<string, string> => {
  const user = getStoredUser();
  if (!user) {
    return {};
  }

  return {
    'x-user-id': user.id,
    'x-user-email': user.email
  };
};
