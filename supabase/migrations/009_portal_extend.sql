-- ============================================================================
-- 009_portal_extend.sql
-- Web admin portal (admin/) support. Idempotent — safe to re-run.
--
-- Design note: the LIVE course hierarchy stays in the existing cms_* tables, and
-- assessments (chapter/mini/milestone/final) are stored as rows in cms_quizzes
-- distinguished by the `kind` column — that is what both the mobile app and the
-- portal read/write. The dedicated mini_challenges / milestone_tests /
-- final_assessments tables below are created per the product spec's table list
-- and reserved for future normalized storage; they are NOT required by the
-- current app and stay empty for now.
--
-- This migration adds: certificates, course_job_requirements, a leaderboards
-- view (if absent), the reserved assessment tables, plus column top-ups needed
-- by the portal (notifications_cms, admin_activity, courses, cms_quizzes).
-- Run in the Supabase SQL editor.
-- ============================================================================

-- ─── Column top-ups the portal relies on ───────────────────────────────────
alter table public.courses add column if not exists thumbnail_url text;
alter table public.cms_quizzes add column if not exists retry_limit integer default 0;
alter table public.cms_quizzes add column if not exists cooldown_minutes integer default 0;

-- admin_activity: the portal's logActivity() writes these columns.
create table if not exists public.admin_activity (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
alter table public.admin_activity add column if not exists admin_email text;
alter table public.admin_activity add column if not exists action text;
alter table public.admin_activity add column if not exists entity text;
alter table public.admin_activity add column if not exists entity_id text;
alter table public.admin_activity add column if not exists detail text;

-- notifications_cms: the composer writes these columns.
create table if not exists public.notifications_cms (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
alter table public.notifications_cms add column if not exists title text;
alter table public.notifications_cms add column if not exists body text;
alter table public.notifications_cms add column if not exists template text;
alter table public.notifications_cms add column if not exists audience jsonb;
alter table public.notifications_cms add column if not exists deep_link text;
alter table public.notifications_cms add column if not exists status text default 'queued';

-- ─── Certificates (earned on final assessment) ──────────────────────────────
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  certificate_url text,
  issued_at timestamptz not null default now(),
  unique (user_id, course_id)
);
create index if not exists idx_certificates_user on public.certificates(user_id);

-- ─── Explicit course→job requirements (alongside jobs.required_course_ids) ──
-- NOTE: jobs.id is TEXT (slug-style) in this project, so job_id is text here.
create table if not exists public.course_job_requirements (
  id uuid primary key default gen_random_uuid(),
  job_id text not null references public.jobs(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (job_id, course_id)
);
create index if not exists idx_cjr_job on public.course_job_requirements(job_id);

-- ─── Reserved normalized assessment tables (per spec; unused for now) ───────
create table if not exists public.mini_challenges (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  chapter_id uuid references public.cms_chapters(id) on delete cascade,
  title text not null,
  xp_reward integer default 20,
  created_at timestamptz not null default now()
);
create table if not exists public.milestone_tests (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  stage_id uuid references public.cms_stages(id) on delete cascade,
  title text not null,
  passing_score integer default 85,
  xp_reward integer default 100,
  created_at timestamptz not null default now()
);
create table if not exists public.final_assessments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  passing_score integer default 90,
  xp_reward integer default 300,
  created_at timestamptz not null default now()
);

-- ─── Leaderboards view (if not already created by an earlier migration) ─────
do $$
begin
  if not exists (select 1 from pg_views where schemaname = 'public' and viewname = 'leaderboards') then
    execute $v$
      create view public.leaderboards as
      select id as user_id, full_name, country, level, xp,
             rank() over (order by xp desc nulls last) as rank
      from public.profiles
    $v$;
  end if;
end $$;

-- ─── RLS: authenticated read, admin write; certificates owner-readable ──────
do $$
declare t text;
begin
  foreach t in array array[
    'certificates','course_job_requirements',
    'mini_challenges','milestone_tests','final_assessments'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_admin_write on public.%I;', t, t);
    execute format('create policy %I_admin_write on public.%I for all using (public.is_admin()) with check (public.is_admin());', t, t);
    execute format('drop policy if exists %I_read on public.%I;', t, t);
  end loop;

  -- Owner (or admin) can read their own certificates; content tables authed-read.
  execute 'create policy certificates_read on public.certificates for select using (auth.uid() = user_id or public.is_admin())';
  execute 'create policy course_job_requirements_read on public.course_job_requirements for select using (auth.role() = ''authenticated'')';
  execute 'create policy mini_challenges_read on public.mini_challenges for select using (auth.role() = ''authenticated'')';
  execute 'create policy milestone_tests_read on public.milestone_tests for select using (auth.role() = ''authenticated'')';
  execute 'create policy final_assessments_read on public.final_assessments for select using (auth.role() = ''authenticated'')';
end $$;

-- ─── Storage: ensure the spec buckets exist (idempotent) ────────────────────
insert into storage.buckets (id, name, public)
values
  ('course-thumbnails','course-thumbnails', true),
  ('images','images', true),
  ('certificates','certificates', true),
  ('icons','icons', true),
  ('lesson-resources','lesson-resources', true),
  ('videos','videos', true),
  ('pdfs','pdfs', true)
on conflict (id) do nothing;
