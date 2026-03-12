import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  mockChangelog,
  mockDiscussions,
  mockDocs,
  mockFeedback,
  mockIncidents,
  mockIssues,
  mockProviderStatuses,
  mockRoadmap,
  mockTemplates
} from '@/lib/data/mock';

const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function withFallback<T>(load: () => Promise<T>, fallback: () => T): Promise<T> {
  if (!hasSupabase) return fallback();
  try {
    return await load();
  } catch {
    return fallback();
  }
}

export async function getAdminDocs() {
  return withFallback(
    async () => {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.from('docs').select('id,title,slug,published,updated_at').order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; title: string; slug: string; published: boolean; updated_at: string }>;
    },
    () => mockDocs.map((d) => ({ id: d.id, title: d.title, slug: d.slug, published: true, updated_at: d.updated_at }))
  );
}

export async function getAdminFeedback() {
  return withFallback(
    async () => {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.from('feedback_posts').select('id,title,slug,status,updated_at').order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; title: string; slug: string; status: string; updated_at: string }>;
    },
    () => mockFeedback.map((f) => ({ id: f.id, title: f.title, slug: f.slug, status: f.status, updated_at: f.created_at }))
  );
}

export async function getAdminRoadmap() {
  return withFallback(
    async () => {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.from('roadmap_items').select('id,title,slug,status,priority,updated_at').order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; title: string; slug: string; status: string; priority: string; updated_at: string }>;
    },
    () => mockRoadmap.map((r) => ({ id: r.id, title: r.title, slug: r.slug, status: r.status, priority: r.priority, updated_at: r.updated_at }))
  );
}

export async function getAdminTemplates() {
  return withFallback(
    async () => {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.from('templates').select('id,title,slug,provider,format,quality,featured,updated_at').order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; title: string; slug: string; provider: string; format: string; quality: string; featured: boolean; updated_at: string }>;
    },
    () => mockTemplates.map((t) => ({ id: t.id, title: t.title, slug: t.slug, provider: t.provider, format: t.format, quality: t.quality, featured: t.featured, updated_at: new Date().toISOString() }))
  );
}

export async function getAdminProviderStatuses() {
  return withFallback(
    async () => {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.from('provider_statuses').select('provider_key,status,summary,success_rate,retry_recovery_rate,updated_at').order('provider_key', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Array<{ provider_key: string; status: string; summary: string; success_rate: number | null; retry_recovery_rate: number | null; updated_at: string }>;
    },
    () => mockProviderStatuses.map((s) => ({ ...s, status: s.status as string }))
  );
}

export async function getAdminIncidents() {
  return withFallback(
    async () => {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.from('provider_incidents').select('id,title,slug,provider_key,status,severity,updated_at').order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; title: string; slug: string; provider_key: string; status: string; severity: string; updated_at: string }>;
    },
    () => mockIncidents.map((i) => ({ id: i.id, title: i.title, slug: i.slug, provider_key: i.provider_key, status: i.status, severity: i.severity, updated_at: i.updated_at }))
  );
}

export async function getAdminIssues() {
  return withFallback(
    async () => {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.from('known_issues').select('id,title,slug,provider_key,state,severity,updated_at').order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; title: string; slug: string; provider_key: string | null; state: string; severity: string; updated_at: string }>;
    },
    () => mockIssues.map((i) => ({ id: i.id, title: i.title, slug: i.slug, provider_key: i.provider_key, state: i.state, severity: i.severity, updated_at: i.updated_at }))
  );
}

export async function getAdminChangelog() {
  return withFallback(
    async () => {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.from('changelog_entries').select('id,title,slug,category,published,published_at').order('published_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; title: string; slug: string; category: string; published: boolean; published_at: string }>;
    },
    () => mockChangelog.map((c) => ({ id: c.id, title: c.title, slug: c.slug, category: c.category, published: true, published_at: c.published_at }))
  );
}

export async function getAdminDiscussions() {
  return withFallback(
    async () => {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.from('discussions').select('id,title,slug,pinned,locked,views_count,updated_at').order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; title: string; slug: string; pinned: boolean; locked: boolean; views_count: number; updated_at: string }>;
    },
    () => mockDiscussions.map((d) => ({ id: d.id, title: d.title, slug: d.slug, pinned: d.pinned, locked: d.locked, views_count: d.views_count, updated_at: d.created_at }))
  );
}
