-- BatchTube Station global search full-text indexes and RPC
create extension if not exists pg_trgm;

create index if not exists idx_docs_search_fts
  on docs
  using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content, '')));

create index if not exists idx_feedback_posts_search_fts
  on feedback_posts
  using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')));

create index if not exists idx_roadmap_items_search_fts
  on roadmap_items
  using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, '')));

create index if not exists idx_templates_search_fts
  on templates
  using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(provider, '') || ' ' || coalesce(format, '')));

create index if not exists idx_known_issues_search_fts
  on known_issues
  using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(details, '') || ' ' || coalesce(workaround, '')));

create index if not exists idx_changelog_entries_search_fts
  on changelog_entries
  using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, '')));

create index if not exists idx_discussions_search_fts
  on discussions
  using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, '')));

create index if not exists idx_provider_incidents_search_fts
  on provider_incidents
  using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(details, '')));

create or replace function station_global_search(search_query text, max_results integer default 80)
returns table (
  entity_type text,
  id uuid,
  slug text,
  title text,
  subtitle text,
  provider_key text,
  rank real
)
language sql
stable
set search_path = public
as $$
  with q as (
    select websearch_to_tsquery('simple', trim(search_query)) as query
  )
  select * from (
    select
      'doc'::text as entity_type,
      d.id,
      d.slug,
      d.title,
      d.excerpt as subtitle,
      null::text as provider_key,
      ts_rank_cd(to_tsvector('simple', coalesce(d.title, '') || ' ' || coalesce(d.excerpt, '') || ' ' || coalesce(d.content, '')), q.query) as rank
    from docs d
    cross join q
    where d.published = true
      and to_tsvector('simple', coalesce(d.title, '') || ' ' || coalesce(d.excerpt, '') || ' ' || coalesce(d.content, '')) @@ q.query

    union all

    select
      'feedback'::text,
      f.id,
      f.slug,
      f.title,
      f.description,
      null::text,
      ts_rank_cd(to_tsvector('simple', coalesce(f.title, '') || ' ' || coalesce(f.description, '')), q.query)
    from feedback_posts f
    cross join q
    where to_tsvector('simple', coalesce(f.title, '') || ' ' || coalesce(f.description, '')) @@ q.query

    union all

    select
      'roadmap'::text,
      r.id,
      r.slug,
      r.title,
      r.summary,
      null::text,
      ts_rank_cd(to_tsvector('simple', coalesce(r.title, '') || ' ' || coalesce(r.summary, '') || ' ' || coalesce(r.content, '')), q.query)
    from roadmap_items r
    cross join q
    where to_tsvector('simple', coalesce(r.title, '') || ' ' || coalesce(r.summary, '') || ' ' || coalesce(r.content, '')) @@ q.query

    union all

    select
      'template'::text,
      t.id,
      t.slug,
      t.title,
      t.description,
      t.provider,
      ts_rank_cd(to_tsvector('simple', coalesce(t.title, '') || ' ' || coalesce(t.description, '') || ' ' || coalesce(t.provider, '') || ' ' || coalesce(t.format, '')), q.query)
    from templates t
    cross join q
    where t.visibility = 'public'
      and to_tsvector('simple', coalesce(t.title, '') || ' ' || coalesce(t.description, '') || ' ' || coalesce(t.provider, '') || ' ' || coalesce(t.format, '')) @@ q.query

    union all

    select
      'issue'::text,
      i.id,
      i.slug,
      i.title,
      i.summary,
      i.provider_key,
      ts_rank_cd(to_tsvector('simple', coalesce(i.title, '') || ' ' || coalesce(i.summary, '') || ' ' || coalesce(i.details, '') || ' ' || coalesce(i.workaround, '')), q.query)
    from known_issues i
    cross join q
    where to_tsvector('simple', coalesce(i.title, '') || ' ' || coalesce(i.summary, '') || ' ' || coalesce(i.details, '') || ' ' || coalesce(i.workaround, '')) @@ q.query

    union all

    select
      'changelog'::text,
      c.id,
      c.slug,
      c.title,
      c.summary,
      null::text,
      ts_rank_cd(to_tsvector('simple', coalesce(c.title, '') || ' ' || coalesce(c.summary, '') || ' ' || coalesce(c.content, '')), q.query)
    from changelog_entries c
    cross join q
    where c.published = true
      and to_tsvector('simple', coalesce(c.title, '') || ' ' || coalesce(c.summary, '') || ' ' || coalesce(c.content, '')) @@ q.query

    union all

    select
      'discussion'::text,
      d.id,
      d.slug,
      d.title,
      left(d.content, 160),
      null::text,
      ts_rank_cd(to_tsvector('simple', coalesce(d.title, '') || ' ' || coalesce(d.content, '')), q.query)
    from discussions d
    cross join q
    where to_tsvector('simple', coalesce(d.title, '') || ' ' || coalesce(d.content, '')) @@ q.query

    union all

    select
      'incident'::text,
      p.id,
      p.slug,
      p.title,
      p.summary,
      p.provider_key,
      ts_rank_cd(to_tsvector('simple', coalesce(p.title, '') || ' ' || coalesce(p.summary, '') || ' ' || coalesce(p.details, '')), q.query)
    from provider_incidents p
    cross join q
    where to_tsvector('simple', coalesce(p.title, '') || ' ' || coalesce(p.summary, '') || ' ' || coalesce(p.details, '')) @@ q.query
  ) ranked
  order by ranked.rank desc, ranked.title asc
  limit greatest(1, least(coalesce(max_results, 80), 200));
$$;
