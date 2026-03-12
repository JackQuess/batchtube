import type {
  ChangelogEntry,
  Discussion,
  DiscussionReply,
  Doc,
  FeedbackComment,
  FeedbackPost,
  Incident,
  KnownIssue,
  ProviderStatus,
  RoadmapItem,
  SearchEntity,
  TemplatePreset
} from '@/types/domain';
import {
  mockChangelog,
  mockDiscussionReplies,
  mockDiscussions,
  mockDocs,
  mockFeedback,
  mockFeedbackComments,
  mockIncidents,
  mockIssues,
  mockProviderStatuses,
  mockRoadmap,
  mockTemplates
} from '@/lib/data/mock';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function bySlug<T extends { slug: string }>(items: T[], slug: string): T | null {
  return items.find((item) => item.slug === slug) ?? null;
}

function includesQuery(text: string, q: string): boolean {
  return text.toLowerCase().includes(q.toLowerCase());
}

async function withSupabaseFallback<T>(load: () => Promise<T>, fallback: () => T): Promise<T> {
  if (!hasSupabase) return fallback();
  try {
    return await load();
  } catch {
    return fallback();
  }
}

export async function getDocs(params?: { q?: string; category?: string }): Promise<Doc[]> {
  return withSupabaseFallback(
    async () => {
      const supabase = createSupabaseServerClient();
      let query = supabase
        .from('docs')
        .select('id,title,slug,excerpt,content,featured,updated_at,doc_categories(name)')
        .eq('published', true)
        .order('updated_at', { ascending: false });

      if (params?.q) query = query.ilike('title', `%${params.q}%`);
      const { data, error } = await query;
      if (error) throw error;

      const mapped = ((data ?? []) as any[]).map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt,
        content: row.content,
        category: row.doc_categories?.name ?? 'general',
        tags: [],
        featured: row.featured,
        updated_at: row.updated_at
      })) as Doc[];

      if (params?.category && params.category !== 'all') {
        const category = params.category.toLowerCase();
        return mapped.filter((doc) => doc.category.toLowerCase() === category);
      }
      return mapped;
    },
    () =>
      mockDocs.filter((doc) => {
        if (params?.category && params.category !== 'all' && doc.category !== params.category) return false;
        if (params?.q && !includesQuery(`${doc.title} ${doc.excerpt}`, params.q)) return false;
        return true;
      })
  );
}

export async function getDocBySlug(slug: string): Promise<Doc | null> {
  const docs = await getDocs();
  return bySlug(docs, slug);
}

export async function getFeedback(params?: { q?: string; status?: string; sort?: string; category?: string }): Promise<FeedbackPost[]> {
  return withSupabaseFallback(
    async () => {
      const supabase = createSupabaseServerClient();
      let query = supabase
        .from('feedback_posts')
        .select('id,title,slug,description,status,created_at,feedback_categories(name)')
        .order('created_at', { ascending: false });
      if (params?.status && params.status !== 'all') query = query.eq('status', params.status);
      if (params?.q) query = query.ilike('title', `%${params.q}%`);
      const { data, error } = await query;
      if (error) throw error;

      const posts = ((data ?? []) as any[]).map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        status: row.status,
        category: row.feedback_categories?.name?.toLowerCase() ?? 'general',
        votes_count: 0,
        comments_count: 0,
        created_at: row.created_at
      })) as FeedbackPost[];

      const [votesRes, commentsRes] = await Promise.all([
        supabase.from('feedback_votes').select('feedback_post_id'),
        supabase.from('feedback_comments').select('feedback_post_id')
      ]);

      const voteMap = new Map<string, number>();
      for (const v of votesRes.data ?? []) {
        const key = (v as any).feedback_post_id as string;
        voteMap.set(key, (voteMap.get(key) ?? 0) + 1);
      }
      const commentMap = new Map<string, number>();
      for (const c of commentsRes.data ?? []) {
        const key = (c as any).feedback_post_id as string;
        commentMap.set(key, (commentMap.get(key) ?? 0) + 1);
      }

      const enriched = posts
        .map((post) => ({
          ...post,
          votes_count: voteMap.get(post.id) ?? 0,
          comments_count: commentMap.get(post.id) ?? 0
        }))
        .filter((item) => {
          if (params?.category && params.category !== 'all' && item.category !== params.category) return false;
          return true;
        });

      const sort = params?.sort ?? 'trending';
      if (sort === 'latest') return [...enriched].sort((a, b) => b.created_at.localeCompare(a.created_at));
      if (sort === 'top') return [...enriched].sort((a, b) => b.votes_count - a.votes_count);
      return [...enriched].sort((a, b) => b.votes_count + b.comments_count - (a.votes_count + a.comments_count));
    },
    () => {
      const filtered = mockFeedback.filter((item) => {
        if (params?.status && params.status !== 'all' && item.status !== params.status) return false;
        if (params?.category && params.category !== 'all' && item.category !== params.category) return false;
        if (params?.q && !includesQuery(`${item.title} ${item.description}`, params.q)) return false;
        return true;
      });
      const sort = params?.sort ?? 'trending';
      if (sort === 'latest') return [...filtered].sort((a, b) => b.created_at.localeCompare(a.created_at));
      if (sort === 'top') return [...filtered].sort((a, b) => b.votes_count - a.votes_count);
      return [...filtered].sort((a, b) => b.votes_count + b.comments_count - (a.votes_count + a.comments_count));
    }
  );
}

export async function getFeedbackBySlug(slug: string): Promise<FeedbackPost | null> {
  const items = await getFeedback();
  return bySlug(items, slug);
}

export async function getFeedbackComments(postId: string): Promise<FeedbackComment[]> {
  return withSupabaseFallback(
    async () => {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from('feedback_comments')
        .select('id,feedback_post_id,content,created_at,profiles(username)')
        .eq('feedback_post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return ((data ?? []) as any[]).map((row) => ({
        id: row.id,
        feedback_post_id: row.feedback_post_id,
        content: row.content,
        author_name: row.profiles?.username ?? 'user',
        created_at: row.created_at
      })) as FeedbackComment[];
    },
    () => mockFeedbackComments.filter((c) => c.feedback_post_id === postId)
  );
}

export async function getRoadmap(params?: { status?: string; q?: string }): Promise<RoadmapItem[]> {
  return withSupabaseFallback(
    async () => {
      const supabase = createSupabaseServerClient();
      let query = supabase
        .from('roadmap_items')
        .select('id,title,slug,summary,content,status,priority,eta_label,updated_at')
        .order('updated_at', { ascending: false });
      if (params?.status && params.status !== 'all') query = query.eq('status', params.status);
      if (params?.q) query = query.ilike('title', `%${params.q}%`);
      const { data, error } = await query;
      if (error) throw error;
      return ((data ?? []) as any[]).map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        summary: row.summary,
        content: row.content,
        status: row.status,
        priority: row.priority,
        eta_label: row.eta_label,
        tags: [],
        related_feedback_count: 0,
        updated_at: row.updated_at
      })) as RoadmapItem[];
    },
    () =>
      mockRoadmap.filter((item) => {
        if (params?.status && params.status !== 'all' && item.status !== params.status) return false;
        if (params?.q && !includesQuery(`${item.title} ${item.summary}`, params.q)) return false;
        return true;
      })
  );
}

export async function getRoadmapBySlug(slug: string): Promise<RoadmapItem | null> {
  return bySlug(await getRoadmap(), slug);
}

export async function getTemplates(params?: { provider?: string; format?: string; q?: string; sort?: string }): Promise<TemplatePreset[]> {
  return withSupabaseFallback(
    async () => {
      const supabase = createSupabaseServerClient();
      let query = supabase
        .from('templates')
        .select('id,title,slug,description,provider,format,quality,example_config,usage_count,featured')
        .eq('visibility', 'public');
      if (params?.provider && params.provider !== 'all') query = query.eq('provider', params.provider);
      if (params?.format && params.format !== 'all') query = query.eq('format', params.format);
      if (params?.q) query = query.ilike('title', `%${params.q}%`);
      const { data, error } = await query.order(params?.sort === 'recent' ? 'created_at' : 'usage_count', {
        ascending: false
      });
      if (error) throw error;
      return ((data ?? []) as any[]).map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        provider: row.provider,
        format: row.format,
        quality: row.quality,
        tags: [],
        usage_count: row.usage_count ?? 0,
        featured: row.featured ?? false,
        example_config: row.example_config
      })) as TemplatePreset[];
    },
    () => {
      const filtered = mockTemplates.filter((t) => {
        if (params?.provider && params.provider !== 'all' && t.provider !== params.provider) return false;
        if (params?.format && params.format !== 'all' && t.format !== params.format) return false;
        if (params?.q && !includesQuery(`${t.title} ${t.description}`, params.q)) return false;
        return true;
      });
      if (params?.sort === 'recent') return filtered;
      return [...filtered].sort((a, b) => b.usage_count - a.usage_count);
    }
  );
}

export async function getTemplateBySlug(slug: string): Promise<TemplatePreset | null> {
  return bySlug(await getTemplates(), slug);
}

export async function getProviderStatuses(): Promise<ProviderStatus[]> {
  return withSupabaseFallback(
    async () => {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from('provider_statuses')
        .select('provider_key,status,summary,success_rate,retry_recovery_rate,last_incident_at,updated_at')
        .order('provider_key', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ProviderStatus[];
    },
    () => mockProviderStatuses
  );
}

export async function getProviderStatus(provider: string): Promise<ProviderStatus | null> {
  const statuses = await getProviderStatuses();
  return statuses.find((p) => p.provider_key === provider) ?? null;
}

export async function getIncidents(params?: { provider?: string }): Promise<Incident[]> {
  return withSupabaseFallback(
    async () => {
      const supabase = createSupabaseServerClient();
      let query = supabase
        .from('provider_incidents')
        .select('id,provider_key,title,slug,status,severity,summary,details,started_at,resolved_at,updated_at')
        .order('started_at', { ascending: false });
      if (params?.provider) query = query.eq('provider_key', params.provider);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Incident[];
    },
    () => mockIncidents.filter((i) => (params?.provider ? i.provider_key === params.provider : true))
  );
}

export async function getIncidentBySlug(slug: string): Promise<Incident | null> {
  return bySlug(await getIncidents(), slug);
}

export async function getIssues(params?: { provider?: string; state?: string; q?: string }): Promise<KnownIssue[]> {
  return withSupabaseFallback(
    async () => {
      const supabase = createSupabaseServerClient();
      let query = supabase
        .from('known_issues')
        .select('id,title,slug,provider_key,state,severity,summary,details,workaround,updated_at')
        .order('updated_at', { ascending: false });
      if (params?.provider && params.provider !== 'all') query = query.eq('provider_key', params.provider);
      if (params?.state && params.state !== 'all') query = query.eq('state', params.state);
      if (params?.q) query = query.ilike('title', `%${params.q}%`);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as KnownIssue[];
    },
    () =>
      mockIssues.filter((issue) => {
        if (params?.provider && params.provider !== 'all' && issue.provider_key !== params.provider) return false;
        if (params?.state && params.state !== 'all' && issue.state !== params.state) return false;
        if (params?.q && !includesQuery(`${issue.title} ${issue.summary}`, params.q)) return false;
        return true;
      })
  );
}

export async function getIssueBySlug(slug: string): Promise<KnownIssue | null> {
  return bySlug(await getIssues(), slug);
}

export async function getChangelog(params?: { q?: string; category?: string }): Promise<ChangelogEntry[]> {
  return withSupabaseFallback(
    async () => {
      const supabase = createSupabaseServerClient();
      let query = supabase
        .from('changelog_entries')
        .select('id,title,slug,summary,content,category,published_at')
        .eq('published', true)
        .order('published_at', { ascending: false });
      if (params?.category && params.category !== 'all') query = query.eq('category', params.category);
      if (params?.q) query = query.ilike('title', `%${params.q}%`);
      const { data, error } = await query;
      if (error) throw error;
      return ((data ?? []) as any[]).map((row) => ({ ...row, tags: [] })) as ChangelogEntry[];
    },
    () =>
      mockChangelog.filter((entry) => {
        if (params?.category && params.category !== 'all' && entry.category !== params.category) return false;
        if (params?.q && !includesQuery(`${entry.title} ${entry.summary}`, params.q)) return false;
        return true;
      })
  );
}

export async function getChangelogBySlug(slug: string): Promise<ChangelogEntry | null> {
  return bySlug(await getChangelog(), slug);
}

export async function getDiscussions(params?: { category?: string; q?: string }): Promise<Discussion[]> {
  return withSupabaseFallback(
    async () => {
      const supabase = createSupabaseServerClient();
      let query = supabase
        .from('discussions')
        .select('id,title,slug,content,pinned,locked,views_count,created_at,discussion_categories(name)')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (params?.q) query = query.ilike('title', `%${params.q}%`);
      const { data, error } = await query;
      if (error) throw error;

      const rows = ((data ?? []) as any[]).map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        content: row.content,
        category: row.discussion_categories?.name?.toLowerCase() ?? 'general',
        views_count: row.views_count ?? 0,
        replies_count: 0,
        pinned: row.pinned ?? false,
        locked: row.locked ?? false,
        created_at: row.created_at
      })) as Discussion[];

      if (params?.category && params.category !== 'all') return rows.filter((row) => row.category === params.category);
      return rows;
    },
    () =>
      mockDiscussions.filter((d) => {
        if (params?.category && params.category !== 'all' && d.category !== params.category) return false;
        if (params?.q && !includesQuery(`${d.title} ${d.content}`, params.q)) return false;
        return true;
      })
  );
}

export async function getDiscussionBySlug(slug: string): Promise<Discussion | null> {
  return bySlug(await getDiscussions(), slug);
}

export async function getDiscussionReplies(discussionId: string): Promise<DiscussionReply[]> {
  return withSupabaseFallback(
    async () => {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from('discussion_replies')
        .select('id,discussion_id,content,created_at,profiles(username)')
        .eq('discussion_id', discussionId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return ((data ?? []) as any[]).map((row) => ({
        id: row.id,
        discussion_id: row.discussion_id,
        content: row.content,
        author_name: row.profiles?.username ?? 'user',
        created_at: row.created_at
      })) as DiscussionReply[];
    },
    () => mockDiscussionReplies.filter((reply) => reply.discussion_id === discussionId)
  );
}

export async function getHomeData() {
  const [providers, incidents, templates, feedback, changelog, issues] = await Promise.all([
    getProviderStatuses(),
    getIncidents(),
    getTemplates({ sort: 'popular' }),
    getFeedback({ sort: 'top' }),
    getChangelog(),
    getIssues()
  ]);

  return {
    providers,
    incidents: incidents.slice(0, 4),
    templates: templates.slice(0, 4),
    feedback: feedback.slice(0, 4),
    changelog: changelog.slice(0, 4),
    issues: issues.slice(0, 4)
  };
}

export async function globalSearch(query: string): Promise<SearchEntity[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (hasSupabase) {
    try {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.rpc('station_global_search', {
        search_query: trimmed,
        max_results: 120
      });
      if (error) throw error;

      const mapped: SearchEntity[] = [];
      for (const row of (data ?? []) as any[]) {
        const item = {
          id: row.id,
          slug: row.slug,
          title: row.title
        };

        switch (row.entity_type) {
          case 'doc':
            mapped.push({ type: 'doc', item: { ...item, excerpt: row.subtitle ?? '', content: '', category: 'general', tags: [], featured: false, updated_at: new Date().toISOString() } });
            break;
          case 'feedback':
            mapped.push({ type: 'feedback', item: { ...item, description: row.subtitle ?? '', status: 'open', category: 'general', votes_count: 0, comments_count: 0, created_at: new Date().toISOString() } });
            break;
          case 'roadmap':
            mapped.push({ type: 'roadmap', item: { ...item, summary: row.subtitle ?? '', content: null, status: 'planned', priority: 'medium', eta_label: null, tags: [], related_feedback_count: 0, updated_at: new Date().toISOString() } });
            break;
          case 'template':
            mapped.push({ type: 'template', item: { ...item, description: row.subtitle ?? '', provider: row.provider_key ?? 'generic', format: 'mixed', quality: 'best', tags: [], usage_count: 0, featured: false, example_config: null } });
            break;
          case 'issue':
            mapped.push({ type: 'issue', item: { ...item, provider_key: row.provider_key ?? null, state: 'identified', severity: 'medium', summary: row.subtitle ?? '', details: row.subtitle ?? '', workaround: null, updated_at: new Date().toISOString() } });
            break;
          case 'changelog':
            mapped.push({ type: 'changelog', item: { ...item, summary: row.subtitle ?? '', content: '', category: 'product', tags: [], published_at: new Date().toISOString() } });
            break;
          case 'discussion':
            mapped.push({ type: 'discussion', item: { ...item, content: row.subtitle ?? '', category: 'general', views_count: 0, replies_count: 0, pinned: false, locked: false, created_at: new Date().toISOString() } });
            break;
          case 'incident':
            mapped.push({ type: 'incident', item: { ...item, provider_key: row.provider_key ?? 'platform', status: 'investigating', severity: 'medium', summary: row.subtitle ?? '', details: row.subtitle ?? '', started_at: new Date().toISOString(), resolved_at: null, updated_at: new Date().toISOString() } });
            break;
          default:
            break;
        }
      }
      return mapped;
    } catch {
      // Fall through to lightweight in-process search
    }
  }

  const [docs, feedback, roadmap, templates, issues, changelog, discussions, incidents] = await Promise.all([
    getDocs({ q: trimmed }),
    getFeedback({ q: trimmed }),
    getRoadmap({ q: trimmed }),
    getTemplates({ q: trimmed }),
    getIssues({ q: trimmed }),
    getChangelog({ q: trimmed }),
    getDiscussions({ q: trimmed }),
    getIncidents()
  ]);

  const filteredIncidents = incidents.filter((item) => includesQuery(`${item.title} ${item.summary}`, trimmed));

  return [
    ...docs.map((item) => ({ type: 'doc' as const, item })),
    ...feedback.map((item) => ({ type: 'feedback' as const, item })),
    ...roadmap.map((item) => ({ type: 'roadmap' as const, item })),
    ...templates.map((item) => ({ type: 'template' as const, item })),
    ...issues.map((item) => ({ type: 'issue' as const, item })),
    ...changelog.map((item) => ({ type: 'changelog' as const, item })),
    ...discussions.map((item) => ({ type: 'discussion' as const, item })),
    ...filteredIncidents.map((item) => ({ type: 'incident' as const, item }))
  ];
}
