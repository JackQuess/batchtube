'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole, requireUser } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { toSlug } from '@/lib/utils/slug';

const commentSchema = z.object({ postId: z.string().uuid().or(z.string()), content: z.string().min(3).max(1500) });
const discussionSchema = z.object({ title: z.string().min(5).max(120), content: z.string().min(10), category: z.string().min(2).max(40) });

function readString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function readOptional(formData: FormData, key: string): string | undefined {
  const value = readString(formData, key);
  return value ? value : undefined;
}

function readBoolean(formData: FormData, key: string): boolean {
  const value = String(formData.get(key) ?? '');
  return value === 'on' || value === 'true' || value === '1';
}

export async function voteFeedback(postId: string) {
  const user = await requireUser();
  const supabase = createSupabaseServerClient();
  await supabase.from('feedback_votes').upsert({ feedback_post_id: postId, user_id: user.id }, { onConflict: 'user_id,feedback_post_id' });
  revalidatePath('/feedback');
}

export async function unvoteFeedback(postId: string) {
  const user = await requireUser();
  const supabase = createSupabaseServerClient();
  await supabase.from('feedback_votes').delete().eq('feedback_post_id', postId).eq('user_id', user.id);
  revalidatePath('/feedback');
}

export async function addFeedbackComment(input: { postId: string; content: string }) {
  const parsed = commentSchema.parse(input);
  const user = await requireUser();
  const supabase = createSupabaseServerClient();
  await supabase.from('feedback_comments').insert({ feedback_post_id: parsed.postId, user_id: user.id, content: parsed.content });
  revalidatePath('/feedback');
}

export async function createDiscussion(input: { title: string; content: string; category: string }) {
  const parsed = discussionSchema.parse(input);
  const user = await requireUser();
  const supabase = createSupabaseServerClient();
  const slug = toSlug(parsed.title);
  await supabase.from('discussions').insert({
    title: parsed.title,
    slug,
    content: parsed.content,
    category_id: null,
    created_by: user.id
  });
  revalidatePath('/discussions');
  return slug;
}

export async function addDiscussionReply(input: { discussionId: string; content: string }) {
  const parsed = commentSchema.parse({ postId: input.discussionId, content: input.content });
  const user = await requireUser();
  const supabase = createSupabaseServerClient();
  await supabase.from('discussion_replies').insert({ discussion_id: parsed.postId, created_by: user.id, content: parsed.content });
  revalidatePath('/discussions');
}

export async function updateProfile(input: { username: string; avatarUrl?: string }) {
  const user = await requireUser();
  const supabase = createSupabaseServerClient();
  await supabase
    .from('profiles')
    .update({ username: input.username, avatar_url: input.avatarUrl ?? null, updated_at: new Date().toISOString() })
    .eq('id', user.id);
  revalidatePath('/account');
}

export async function adminUpsertDoc(input: { id?: string; title: string; excerpt: string; content: string; categoryId?: string }) {
  await requireRole(['admin', 'moderator']);
  const supabase = createSupabaseServerClient();
  const slug = toSlug(input.title);
  await supabase.from('docs').upsert({ id: input.id, title: input.title, slug, excerpt: input.excerpt, content: input.content, category_id: input.categoryId ?? null, published: true });
  revalidatePath('/docs');
  revalidatePath('/admin/docs');
}

export async function adminUpsertRoadmap(input: { id?: string; title: string; summary: string; status: string; priority: string; etaLabel?: string }) {
  await requireRole(['admin', 'moderator']);
  const supabase = createSupabaseServerClient();
  await supabase.from('roadmap_items').upsert({ id: input.id, title: input.title, slug: toSlug(input.title), summary: input.summary, status: input.status, priority: input.priority, eta_label: input.etaLabel ?? null });
  revalidatePath('/roadmap');
  revalidatePath('/admin/roadmap');
}

export async function adminUpsertIncident(input: { id?: string; title: string; providerKey: string; status: string; severity: string; summary: string; details: string }) {
  await requireRole(['admin', 'moderator']);
  const supabase = createSupabaseServerClient();
  await supabase.from('provider_incidents').upsert({ id: input.id, title: input.title, slug: toSlug(input.title), provider_key: input.providerKey, status: input.status, severity: input.severity, summary: input.summary, details: input.details, started_at: new Date().toISOString() });
  revalidatePath('/status');
  revalidatePath('/admin/status');
}

export async function adminUpsertKnownIssue(input: { id?: string; title: string; providerKey?: string; state: string; severity: string; summary: string; details: string; workaround?: string }) {
  await requireRole(['admin', 'moderator']);
  const supabase = createSupabaseServerClient();
  await supabase.from('known_issues').upsert({ id: input.id, title: input.title, slug: toSlug(input.title), provider_key: input.providerKey ?? null, state: input.state, severity: input.severity, summary: input.summary, details: input.details, workaround: input.workaround ?? null });
  revalidatePath('/issues');
  revalidatePath('/admin/issues');
}

export async function adminUpsertChangelog(input: { id?: string; title: string; summary: string; content: string; category: string }) {
  await requireRole(['admin', 'moderator']);
  const supabase = createSupabaseServerClient();
  await supabase.from('changelog_entries').upsert({ id: input.id, title: input.title, slug: toSlug(input.title), summary: input.summary, content: input.content, category: input.category, published: true, published_at: new Date().toISOString() });
  revalidatePath('/changelog');
  revalidatePath('/admin/changelog');
}

export async function adminModerateDiscussion(input: { discussionId: string; pinned?: boolean; locked?: boolean }) {
  await requireRole(['admin', 'moderator']);
  const supabase = createSupabaseServerClient();
  await supabase.from('discussions').update({ pinned: input.pinned, locked: input.locked }).eq('id', input.discussionId);
  revalidatePath('/discussions');
  revalidatePath('/admin/discussions');
}

export async function adminUpsertFeedback(input: {
  id?: string;
  title: string;
  description: string;
  status: string;
  categoryId?: string;
}) {
  await requireRole(['admin', 'moderator']);
  const user = await requireUser();
  const supabase = createSupabaseServerClient();
  await supabase.from('feedback_posts').upsert({
    id: input.id,
    title: input.title,
    slug: toSlug(input.title),
    description: input.description,
    status: input.status,
    category_id: input.categoryId ?? null,
    created_by: user.id
  });
  revalidatePath('/feedback');
  revalidatePath('/admin/feedback');
}

export async function adminUpsertTemplate(input: {
  id?: string;
  title: string;
  description: string;
  provider: string;
  format: string;
  quality: string;
  featured?: boolean;
}) {
  await requireRole(['admin', 'moderator']);
  const user = await requireUser();
  const supabase = createSupabaseServerClient();
  await supabase.from('templates').upsert({
    id: input.id,
    title: input.title,
    slug: toSlug(input.title),
    description: input.description,
    provider: input.provider,
    format: input.format,
    quality: input.quality,
    featured: Boolean(input.featured),
    created_by: user.id
  });
  revalidatePath('/templates');
  revalidatePath('/admin/templates');
}

export async function adminUpsertProviderStatus(input: {
  providerKey: string;
  status: string;
  summary: string;
  successRate?: number;
  retryRecoveryRate?: number;
}) {
  await requireRole(['admin', 'moderator']);
  const supabase = createSupabaseServerClient();
  await supabase.from('provider_statuses').upsert({
    provider_key: input.providerKey,
    status: input.status,
    summary: input.summary,
    success_rate: input.successRate ?? null,
    retry_recovery_rate: input.retryRecoveryRate ?? null,
    updated_at: new Date().toISOString()
  });
  revalidatePath('/status');
  revalidatePath('/admin/status');
}

export async function adminUpsertDiscussion(input: { id?: string; title: string; content: string; pinned?: boolean; locked?: boolean }) {
  await requireRole(['admin', 'moderator']);
  const user = await requireUser();
  const supabase = createSupabaseServerClient();
  await supabase.from('discussions').upsert({
    id: input.id,
    title: input.title,
    slug: toSlug(input.title),
    content: input.content,
    created_by: user.id,
    pinned: Boolean(input.pinned),
    locked: Boolean(input.locked)
  });
  revalidatePath('/discussions');
  revalidatePath('/admin/discussions');
}

export async function adminUpsertDocForm(formData: FormData) {
  await adminUpsertDoc({
    id: readOptional(formData, 'id'),
    title: readString(formData, 'title'),
    excerpt: readString(formData, 'excerpt'),
    content: readString(formData, 'content'),
    categoryId: readOptional(formData, 'categoryId')
  });
}

export async function adminUpsertFeedbackForm(formData: FormData) {
  await adminUpsertFeedback({
    id: readOptional(formData, 'id'),
    title: readString(formData, 'title'),
    description: readString(formData, 'description'),
    status: readString(formData, 'status'),
    categoryId: readOptional(formData, 'categoryId')
  });
}

export async function adminUpsertRoadmapForm(formData: FormData) {
  await adminUpsertRoadmap({
    id: readOptional(formData, 'id'),
    title: readString(formData, 'title'),
    summary: readString(formData, 'summary'),
    status: readString(formData, 'status'),
    priority: readString(formData, 'priority'),
    etaLabel: readOptional(formData, 'etaLabel')
  });
}

export async function adminUpsertTemplateForm(formData: FormData) {
  await adminUpsertTemplate({
    id: readOptional(formData, 'id'),
    title: readString(formData, 'title'),
    description: readString(formData, 'description'),
    provider: readString(formData, 'provider'),
    format: readString(formData, 'format'),
    quality: readString(formData, 'quality'),
    featured: readBoolean(formData, 'featured')
  });
}

export async function adminUpsertProviderStatusForm(formData: FormData) {
  await adminUpsertProviderStatus({
    providerKey: readString(formData, 'providerKey'),
    status: readString(formData, 'status'),
    summary: readString(formData, 'summary'),
    successRate: readOptional(formData, 'successRate') ? Number(readString(formData, 'successRate')) : undefined,
    retryRecoveryRate: readOptional(formData, 'retryRecoveryRate') ? Number(readString(formData, 'retryRecoveryRate')) : undefined
  });
}

export async function adminUpsertIncidentForm(formData: FormData) {
  await adminUpsertIncident({
    id: readOptional(formData, 'id'),
    title: readString(formData, 'title'),
    providerKey: readString(formData, 'providerKey'),
    status: readString(formData, 'status'),
    severity: readString(formData, 'severity'),
    summary: readString(formData, 'summary'),
    details: readString(formData, 'details')
  });
}

export async function adminUpsertKnownIssueForm(formData: FormData) {
  await adminUpsertKnownIssue({
    id: readOptional(formData, 'id'),
    title: readString(formData, 'title'),
    providerKey: readOptional(formData, 'providerKey'),
    state: readString(formData, 'state'),
    severity: readString(formData, 'severity'),
    summary: readString(formData, 'summary'),
    details: readString(formData, 'details'),
    workaround: readOptional(formData, 'workaround')
  });
}

export async function adminUpsertChangelogForm(formData: FormData) {
  await adminUpsertChangelog({
    id: readOptional(formData, 'id'),
    title: readString(formData, 'title'),
    summary: readString(formData, 'summary'),
    content: readString(formData, 'content'),
    category: readString(formData, 'category')
  });
}

export async function adminUpsertDiscussionForm(formData: FormData) {
  await adminUpsertDiscussion({
    id: readOptional(formData, 'id'),
    title: readString(formData, 'title'),
    content: readString(formData, 'content'),
    pinned: readBoolean(formData, 'pinned'),
    locked: readBoolean(formData, 'locked')
  });
}

export async function adminModerateDiscussionForm(formData: FormData) {
  await adminModerateDiscussion({
    discussionId: readString(formData, 'discussionId'),
    pinned: readBoolean(formData, 'pinned'),
    locked: readBoolean(formData, 'locked')
  });
}
