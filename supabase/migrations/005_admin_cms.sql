-- ============================================================================
-- 005_admin_cms.sql
-- Dynamic CMS: courses/jobs/lessons/quizzes managed from the in-app Admin
-- Dashboard. UUID PKs everywhere, email-whitelist admin gating, RLS so regular
-- users are read-only (published content) and admins get full CRUD.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ─── Admin whitelist + helper ───────────────────────────────────────────────
create table if not exists public.admin_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

insert into public.admin_emails (email)
values ('nolojiatechnologies@gmail.com')
on conflict (email) do nothing;

-- Optional mirror flag on profiles (kept in sync for convenience / web admin).
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- True when the current authenticated user's email is whitelisted.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_emails
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ─── Courses hierarchy ──────────────────────────────────────────────────────
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  thumbnail_url text,
  difficulty text not null default 'beginner' check (difficulty in ('beginner','intermediate','advanced','expert','master')),
  category text default 'general',
  estimated_hours numeric default 0,
  xp_reward integer default 0,
  required_level integer default 1,
  tags text[] default '{}',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  order_index integer default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stages (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text default '',
  order_index integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  stage_id uuid references public.stages(id) on delete cascade,
  title text not null,
  description text default '',
  is_milestone boolean default false,
  order_index integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  type text not null default 'text' check (type in ('text','video','image','code','exercise','checklist','resources')),
  content jsonb default '{}'::jsonb,
  resources jsonb default '[]'::jsonb,
  duration_minutes integer default 5,
  xp_reward integer default 15,
  order_index integer default 0,
  created_at timestamptz not null default now()
);

-- Reconcile a PRE-EXISTING lessons table (original schema keys lessons by module,
-- not chapter). Adds the CMS columns so the index/FKs + phase-2 editors work.
alter table public.lessons add column if not exists chapter_id uuid references public.chapters(id) on delete cascade;
alter table public.lessons add column if not exists course_id uuid references public.courses(id) on delete cascade;
alter table public.lessons add column if not exists type text default 'text';
alter table public.lessons add column if not exists content jsonb default '{}'::jsonb;
alter table public.lessons add column if not exists resources jsonb default '[]'::jsonb;
alter table public.lessons add column if not exists order_index integer default 0;

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid references public.chapters(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  title text not null default 'Quiz',
  kind text not null default 'chapter' check (kind in ('mini_challenge','chapter','milestone','final')),
  passing_score integer default 80,
  xp_reward integer default 50,
  cooldown_minutes integer default 180,
  retry_limit integer default 3,
  order_index integer default 0,
  created_at timestamptz not null default now()
);

-- Reconcile a PRE-EXISTING quizzes table with the CMS columns.
alter table public.quizzes add column if not exists chapter_id uuid references public.chapters(id) on delete cascade;
alter table public.quizzes add column if not exists course_id uuid references public.courses(id) on delete cascade;
alter table public.quizzes add column if not exists kind text default 'chapter';
alter table public.quizzes add column if not exists passing_score integer default 80;
alter table public.quizzes add column if not exists xp_reward integer default 50;
alter table public.quizzes add column if not exists cooldown_minutes integer default 180;
alter table public.quizzes add column if not exists retry_limit integer default 3;
alter table public.quizzes add column if not exists order_index integer default 0;

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  type text not null default 'multiple_choice' check (type in ('multiple_choice','true_false','fill_blank','scenario')),
  prompt text not null,
  options jsonb default '[]'::jsonb,
  answer text not null,
  explanation text default '',
  order_index integer default 0,
  created_at timestamptz not null default now()
);

-- ─── Jobs ───────────────────────────────────────────────────────────────────
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  description text default '',
  salary_min integer default 0,
  salary_max integer default 0,
  salary_currency text default 'USD',
  country text default 'Remote',
  country_flag text default '🌍',
  category text default 'general',
  type text not null default 'remote' check (type in ('remote','hybrid','full_time','part_time','freelance')),
  required_xp integer default 0,
  required_level integer default 1,
  required_course_ids uuid[] default '{}',
  difficulty text default 'beginner',
  application_url text,
  status text not null default 'draft' check (status in ('draft','published','closed')),
  order_index integer default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reconcile a PRE-EXISTING jobs table (003_jobs_feature uses id TEXT, is_active,
-- remote_type, min_xp …). These add the CMS columns the admin + policies need,
-- whether the table is brand-new (no-ops) or already present (adds them).
alter table public.jobs add column if not exists status text not null default 'published';
alter table public.jobs add column if not exists type text not null default 'remote';
alter table public.jobs add column if not exists category text default 'general';
alter table public.jobs add column if not exists required_xp integer default 0;
alter table public.jobs add column if not exists required_level integer default 1;
alter table public.jobs add column if not exists required_course_ids uuid[] default '{}';
alter table public.jobs add column if not exists application_url text;
alter table public.jobs add column if not exists order_index integer default 0;
alter table public.jobs add column if not exists created_by uuid;
alter table public.jobs add column if not exists updated_at timestamptz not null default now();
alter table public.jobs add column if not exists country text default 'Remote';
alter table public.jobs add column if not exists country_flag text default '🌍';

-- If the pre-existing table keyed jobs by TEXT, give it a generated default so
-- admin inserts (which don't supply an id) work.
do $$
begin
  if (select data_type from information_schema.columns
      where table_schema = 'public' and table_name = 'jobs' and column_name = 'id') = 'text' then
    alter table public.jobs alter column id set default gen_random_uuid()::text;
  end if;
end $$;

-- ─── Notifications (admin broadcasts) ───────────────────────────────────────
create table if not exists public.notifications_cms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  template text,
  audience jsonb default '{"type":"everyone"}'::jsonb,
  status text not null default 'draft' check (status in ('draft','scheduled','sent')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ─── Analytics + admin audit + progress ─────────────────────────────────────
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event text not null,
  params jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_activity (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  status text default 'in_progress',
  meta jsonb default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

-- Leaderboard as a view over profiles (xp-ranked).
create or replace view public.leaderboards as
  select id as user_id, full_name, avatar_url, country, xp, level,
         rank() over (order by xp desc) as rank
  from public.profiles;

-- ─── Helpful indexes ────────────────────────────────────────────────────────
create index if not exists idx_courses_status on public.courses(status);
create index if not exists idx_jobs_status on public.jobs(status);
create index if not exists idx_chapters_course on public.chapters(course_id);
create index if not exists idx_lessons_chapter on public.lessons(chapter_id);
create index if not exists idx_questions_quiz on public.questions(quiz_id);
create index if not exists idx_analytics_event on public.analytics_events(event);

-- ─── updated_at trigger ─────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_courses_updated on public.courses;
create trigger trg_courses_updated before update on public.courses
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_jobs_updated on public.jobs;
create trigger trg_jobs_updated before update on public.jobs
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- Row Level Security
--  • published courses/jobs are readable by anyone; drafts/archived: admins only
--  • content tables (stages/chapters/lessons/quizzes/questions): authenticated read
--  • all writes require is_admin()
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'admin_emails','courses','stages','chapters','lessons','quizzes','questions',
    'jobs','notifications_cms','analytics_events','admin_activity','user_progress'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- Courses / Jobs: public read of published, admin read all + full write.
drop policy if exists courses_read on public.courses;
create policy courses_read on public.courses for select
  using (status = 'published' or public.is_admin());
drop policy if exists courses_write on public.courses;
create policy courses_write on public.courses for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists jobs_read on public.jobs;
create policy jobs_read on public.jobs for select
  using (status = 'published' or public.is_admin());
drop policy if exists jobs_write on public.jobs;
create policy jobs_write on public.jobs for all
  using (public.is_admin()) with check (public.is_admin());

-- Content tables: any authenticated user reads; only admins write.
do $$
declare t text;
begin
  foreach t in array array['stages','chapters','lessons','quizzes','questions'] loop
    execute format('drop policy if exists %I_read on public.%I;', t, t);
    execute format('create policy %I_read on public.%I for select using (auth.role() = ''authenticated'');', t, t);
    execute format('drop policy if exists %I_write on public.%I;', t, t);
    execute format('create policy %I_write on public.%I for all using (public.is_admin()) with check (public.is_admin());', t, t);
  end loop;
end $$;

-- Admin-only tables.
drop policy if exists admin_emails_admin on public.admin_emails;
create policy admin_emails_admin on public.admin_emails for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists notifications_admin on public.notifications_cms;
create policy notifications_admin on public.notifications_cms for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_activity_admin on public.admin_activity;
create policy admin_activity_admin on public.admin_activity for all
  using (public.is_admin()) with check (public.is_admin());

-- Analytics: any authenticated user may insert events; only admins read.
drop policy if exists analytics_insert on public.analytics_events;
create policy analytics_insert on public.analytics_events for insert
  with check (auth.role() = 'authenticated');
drop policy if exists analytics_read on public.analytics_events;
create policy analytics_read on public.analytics_events for select
  using (public.is_admin());

-- User progress: owner CRUD, admins read all.
drop policy if exists progress_own on public.user_progress;
create policy progress_own on public.user_progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists progress_admin_read on public.user_progress;
create policy progress_admin_read on public.user_progress for select
  using (public.is_admin());

-- ============================================================================
-- Storage buckets (public read, admin write)
-- ============================================================================
insert into storage.buckets (id, name, public)
values
  ('course-thumbnails','course-thumbnails', true),
  ('images','images', true),
  ('certificates','certificates', true),
  ('icons','icons', true),
  ('lesson-resources','lesson-resources', true),
  ('videos','videos', true)
on conflict (id) do nothing;

drop policy if exists storage_public_read on storage.objects;
create policy storage_public_read on storage.objects for select
  using (bucket_id in ('course-thumbnails','images','certificates','icons','lesson-resources','videos'));

drop policy if exists storage_admin_write on storage.objects;
create policy storage_admin_write on storage.objects for all
  using (public.is_admin() and bucket_id in ('course-thumbnails','images','certificates','icons','lesson-resources','videos'))
  with check (public.is_admin() and bucket_id in ('course-thumbnails','images','certificates','icons','lesson-resources','videos'));
