-- ============================================================================
-- 006_cms_content.sql
-- Clean, dedicated tables for admin-managed course content (lessons, quizzes,
-- questions). Kept separate from the legacy `lessons`/`quizzes` tables (which
-- have NOT NULL columns the CMS doesn't use), so admin inserts never conflict.
-- Attached directly to `courses` (from 005). RLS: authenticated read, admin CRUD.
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.cms_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  type text not null default 'text' check (type in ('text','video','image','code','exercise','checklist','resources')),
  body text default '',
  content jsonb default '{}'::jsonb,
  resources jsonb default '[]'::jsonb,
  media_url text,
  duration_minutes integer default 5,
  xp_reward integer default 15,
  order_index integer default 0,
  status text not null default 'published' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null default 'Quiz',
  kind text not null default 'chapter' check (kind in ('mini_challenge','chapter','milestone','final')),
  passing_score integer default 80,
  xp_reward integer default 50,
  cooldown_minutes integer default 180,
  retry_limit integer default 3,
  order_index integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.cms_quizzes(id) on delete cascade,
  type text not null default 'multiple_choice' check (type in ('multiple_choice','true_false','fill_blank','scenario')),
  prompt text not null,
  options jsonb default '[]'::jsonb,
  answer text not null,
  explanation text default '',
  order_index integer default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_cms_lessons_course on public.cms_lessons(course_id);
create index if not exists idx_cms_quizzes_course on public.cms_quizzes(course_id);
create index if not exists idx_cms_questions_quiz on public.cms_questions(quiz_id);

-- updated_at triggers (reuse touch_updated_at() from 005)
drop trigger if exists trg_cms_lessons_updated on public.cms_lessons;
create trigger trg_cms_lessons_updated before update on public.cms_lessons
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_cms_quizzes_updated on public.cms_quizzes;
create trigger trg_cms_quizzes_updated before update on public.cms_quizzes
  for each row execute function public.touch_updated_at();

-- RLS: authenticated read, admin full CRUD (is_admin() from 005).
do $$
declare t text;
begin
  foreach t in array array['cms_lessons','cms_quizzes','cms_questions'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_read on public.%I;', t, t);
    execute format('create policy %I_read on public.%I for select using (auth.role() = ''authenticated'');', t, t);
    execute format('drop policy if exists %I_write on public.%I;', t, t);
    execute format('create policy %I_write on public.%I for all using (public.is_admin()) with check (public.is_admin());', t, t);
  end loop;
end $$;
