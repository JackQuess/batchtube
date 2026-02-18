import { AuthUser } from '../types';

const STORAGE_KEY = 'batchtube_user';
const AUTH_EVENT = 'batchtube-auth-change';

export const getStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (!parsed?.id || !parsed?.email) return null;
    return {
      id: String(parsed.id),
      email: String(parsed.email),
      plan: parsed.plan === 'pro' ? 'pro' : 'free'
    };
  } catch {
    return null;
  }
};

export const saveUser = (user: AuthUser) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent(AUTH_EVENT));
};

export const clearUser = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(AUTH_EVENT));
};

export const updateUserPlan = (plan: 'free' | 'pro') => {
  const current = getStoredUser();
  if (!current) return;
  saveUser({ ...current, plan });
};

export const generateUserId = () => {
  return `u_${Math.random().toString(36).slice(2, 10)}`;
};

export const getAuthHeaders = (): Record<string, string> => {
  const user = getStoredUser();
  if (!user) return {};
  return {
    'x-user-id': user.id,
    'x-user-email': user.email
  };
};

export const AUTH_CHANGE_EVENT = AUTH_EVENT;
