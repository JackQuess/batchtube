-- BatchTube Station schema
create extension if not exists pgcrypto;

create type app_role as enum ('user','moderator','admin');
create type feedback_status as enum ('open','planned','in_progress','completed','declined');
create type roadmap_status as enum ('under_consideration','planned','in_progress','completed');
create type provider_health_status as enum ('operational','degraded','partial_outage','outage');
create type incident_status as enum ('investigating','identified','monitoring','resolved');
create type issue_state as enum ('investigating','identified','monitoring','resolved');
create type changelog_category as enum ('reliability','performance','product','community','status','security','platform','observability');

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  role app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backward-compatible hardening for projects where public.profiles already existed
alter table if exists profiles add column if not exists username text;
alter table if exists profiles add column if not exists avatar_url text;
alter table if exists profiles add column if not exists role app_role not null default 'user';
alter table if exists profiles add column if not exists created_at timestamptz not null default now();
alter table if exists profiles add column if not exists updated_at timestamptz not null default now();
do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public' and indexname = 'profiles_username_key'
  ) then
    create unique index profiles_username_key on profiles(username);
  end if;
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists doc_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists docs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null,
  content text not null,
  category_id uuid references doc_categories(id) on delete set null,
  published boolean not null default false,
  featured boolean not null default false,
  view_count integer not null default 0,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists feedback_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists feedback_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  status feedback_status not null default 'open',
  category_id uuid references feedback_categories(id) on delete set null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists feedback_votes (
  id uuid primary key default gen_random_uuid(),
  feedback_post_id uuid not null references feedback_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, feedback_post_id)
);

create table if not exists feedback_comments (
  id uuid primary key default gen_random_uuid(),
  feedback_post_id uuid not null references feedback_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists roadmap_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text not null,
  content text,
  status roadmap_status not null default 'planned',
  priority text not null default 'medium',
  eta_label text,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists roadmap_feedback_links (
  roadmap_item_id uuid not null references roadmap_items(id) on delete cascade,
  feedback_post_id uuid not null references feedback_posts(id) on delete cascade,
  primary key (roadmap_item_id, feedback_post_id)
);

create table if not exists template_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  provider text not null,
  format text not null,
  quality text not null,
  example_config jsonb,
  usage_count integer not null default 0,
  featured boolean not null default false,
  visibility text not null default 'public',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists provider_statuses (
  id uuid primary key default gen_random_uuid(),
  provider_key text not null unique,
  status provider_health_status not null default 'operational',
  summary text not null,
  success_rate numeric(5,2),
  retry_recovery_rate numeric(5,2),
  last_incident_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists provider_incidents (
  id uuid primary key default gen_random_uuid(),
  provider_key text not null,
  title text not null,
  slug text not null unique,
  status incident_status not null default 'investigating',
  severity text not null default 'medium',
  summary text not null,
  details text not null,
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists incident_updates (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references provider_incidents(id) on delete cascade,
  status incident_status not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists known_issues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  provider_key text,
  state issue_state not null default 'investigating',
  severity text not null default 'medium',
  summary text not null,
  details text not null,
  workaround text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists issue_updates (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references known_issues(id) on delete cascade,
  state issue_state not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists changelog_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text not null,
  content text not null,
  category changelog_category not null,
  featured boolean not null default false,
  published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists discussion_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists discussions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text not null,
  category_id uuid references discussion_categories(id) on delete set null,
  created_by uuid references profiles(id) on delete set null,
  pinned boolean not null default false,
  locked boolean not null default false,
  views_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists discussion_replies (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references discussions(id) on delete cascade,
  created_by uuid references profiles(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table if not exists tag_links (
  id uuid primary key default gen_random_uuid(),
  tag_id uuid not null references tags(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null
);

create index if not exists idx_docs_category on docs(category_id);
create index if not exists idx_docs_published on docs(published);
create index if not exists idx_feedback_status on feedback_posts(status);
create index if not exists idx_feedback_created_by on feedback_posts(created_by);
create index if not exists idx_feedback_comments_post on feedback_comments(feedback_post_id);
create index if not exists idx_roadmap_status on roadmap_items(status);
create index if not exists idx_templates_provider on templates(provider);
create index if not exists idx_provider_incidents_provider on provider_incidents(provider_key);
create index if not exists idx_known_issues_provider on known_issues(provider_key);
create index if not exists idx_known_issues_state on known_issues(state);
create index if not exists idx_changelog_category on changelog_entries(category);
create index if not exists idx_discussions_created_by on discussions(created_by);
create index if not exists idx_discussion_replies_discussion on discussion_replies(discussion_id);
create index if not exists idx_tag_links_entity on tag_links(entity_type, entity_id);

create trigger trg_profiles_updated before update on profiles for each row execute function set_updated_at();
create trigger trg_docs_updated before update on docs for each row execute function set_updated_at();
create trigger trg_feedback_posts_updated before update on feedback_posts for each row execute function set_updated_at();
create trigger trg_feedback_comments_updated before update on feedback_comments for each row execute function set_updated_at();
create trigger trg_roadmap_items_updated before update on roadmap_items for each row execute function set_updated_at();
create trigger trg_templates_updated before update on templates for each row execute function set_updated_at();
create trigger trg_provider_incidents_updated before update on provider_incidents for each row execute function set_updated_at();
create trigger trg_known_issues_updated before update on known_issues for each row execute function set_updated_at();
create trigger trg_discussions_updated before update on discussions for each row execute function set_updated_at();
create trigger trg_discussion_replies_updated before update on discussion_replies for each row execute function set_updated_at();

create or replace function has_role(role_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from profiles
    where id = auth.uid() and role::text = role_name
  );
$$;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select has_role('admin');
$$;

alter table profiles enable row level security;
alter table docs enable row level security;
alter table feedback_posts enable row level security;
alter table feedback_votes enable row level security;
alter table feedback_comments enable row level security;
alter table roadmap_items enable row level security;
alter table templates enable row level security;
alter table provider_statuses enable row level security;
alter table provider_incidents enable row level security;
alter table known_issues enable row level security;
alter table changelog_entries enable row level security;
alter table discussions enable row level security;
alter table discussion_replies enable row level security;

create policy "profiles_public_read" on profiles for select using (true);
create policy "profiles_self_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_self_update" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "docs_public_read" on docs for select using (published = true or has_role('moderator') or has_role('admin'));
create policy "docs_admin_manage" on docs for all using (has_role('moderator') or has_role('admin')) with check (has_role('moderator') or has_role('admin'));

create policy "feedback_public_read" on feedback_posts for select using (true);
create policy "feedback_user_create" on feedback_posts for insert with check (auth.uid() = created_by);
create policy "feedback_admin_manage" on feedback_posts for update using (has_role('moderator') or has_role('admin')) with check (has_role('moderator') or has_role('admin'));

create policy "feedback_votes_read" on feedback_votes for select using (true);
create policy "feedback_votes_own_write" on feedback_votes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "feedback_comments_read" on feedback_comments for select using (true);
create policy "feedback_comments_own_write" on feedback_comments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "roadmap_public_read" on roadmap_items for select using (true);
create policy "roadmap_admin_manage" on roadmap_items for all using (has_role('moderator') or has_role('admin')) with check (has_role('moderator') or has_role('admin'));

create policy "templates_public_read" on templates for select using (visibility = 'public' or has_role('moderator') or has_role('admin'));
create policy "templates_admin_manage" on templates for all using (has_role('moderator') or has_role('admin')) with check (has_role('moderator') or has_role('admin'));

create policy "provider_status_public_read" on provider_statuses for select using (true);
create policy "provider_status_admin_manage" on provider_statuses for all using (has_role('moderator') or has_role('admin')) with check (has_role('moderator') or has_role('admin'));

create policy "incidents_public_read" on provider_incidents for select using (true);
create policy "incidents_admin_manage" on provider_incidents for all using (has_role('moderator') or has_role('admin')) with check (has_role('moderator') or has_role('admin'));

create policy "known_issues_public_read" on known_issues for select using (true);
create policy "known_issues_admin_manage" on known_issues for all using (has_role('moderator') or has_role('admin')) with check (has_role('moderator') or has_role('admin'));

create policy "changelog_public_read" on changelog_entries for select using (published = true or has_role('moderator') or has_role('admin'));
create policy "changelog_admin_manage" on changelog_entries for all using (has_role('moderator') or has_role('admin')) with check (has_role('moderator') or has_role('admin'));

create policy "discussions_public_read" on discussions for select using (true);
create policy "discussions_user_create" on discussions for insert with check (auth.uid() = created_by);
create policy "discussions_owner_update" on discussions for update using (auth.uid() = created_by or has_role('moderator') or has_role('admin')) with check (auth.uid() = created_by or has_role('moderator') or has_role('admin'));

create policy "discussion_replies_public_read" on discussion_replies for select using (true);
create policy "discussion_replies_user_create" on discussion_replies for insert with check (auth.uid() = created_by);
create policy "discussion_replies_owner_update" on discussion_replies for update using (auth.uid() = created_by or has_role('moderator') or has_role('admin')) with check (auth.uid() = created_by or has_role('moderator') or has_role('admin'));
