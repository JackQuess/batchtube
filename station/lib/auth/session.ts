import { redirect } from 'next/navigation';
import type { AppRole, Profile } from '@/types/domain';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getCurrentUser() {
  if (!hasSupabaseEnv()) return null;
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!hasSupabaseEnv()) return null;
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, role')
    .eq('id', user.id)
    .single();
  return (data as Profile | null) ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireRole(roles: AppRole[]) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (!roles.includes(profile.role)) redirect('/');
  return profile;
}

export async function hasRole(role: AppRole): Promise<boolean> {
  const profile = await getCurrentProfile();
  return profile?.role === role;
}
