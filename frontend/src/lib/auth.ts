import { AuthUser } from '../types';
import { supabaseAuth } from './supabaseClient';

export const AUTH_CHANGE_EVENT = supabaseAuth.authEvent;

export const getStoredUser = (): AuthUser | null => {
  const session = supabaseAuth.getSession();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    email: session.user.email || '',
    plan: 'free'
  };
};

export const clearUser = () => {
  supabaseAuth.signOut();
};

export const getAuthHeaders = (): Record<string, string> => {
  return supabaseAuth.getAuthHeaders();
};
