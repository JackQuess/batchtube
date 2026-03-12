'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const authSchema = z.object({ email: z.string().email(), password: z.string().min(8) });

export async function signInWithEmail(formData: FormData) {
  const parsed = authSchema.parse({ email: formData.get('email'), password: formData.get('password') });
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed);
  if (error) throw new Error(error.message);
  redirect('/account');
}

export async function signUpWithEmail(formData: FormData) {
  const parsed = authSchema.parse({ email: formData.get('email'), password: formData.get('password') });
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp(parsed);
  if (error) throw new Error(error.message);

  if (data.user) {
    await supabase.from('profiles').upsert({ id: data.user.id, role: 'user' });
  }

  redirect('/account');
}

export async function signOut() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/');
}
