-- ============================================================================
-- 016_certification_core.sql  —  Job Readiness Certification: core tables
-- Idempotent. Run in the Supabase SQL editor.
--
-- Introduces the GLOBAL certification quiz config + the question BANK. These are
-- dedicated tables (independent of the legacy `quizzes`/`questions` and the
-- `cms_quizzes` chapter-quiz tables) so nothing existing is disturbed.
--
-- Security model: the question bank (with correct answers/explanations) is NEVER
-- readable by the mobile (authenticated) role. All mobile access goes through the
-- SECURITY DEFINER RPCs in 018. Admins (is_admin()) get full CRUD for the CMS.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ─── Certification quiz config (one published row = the live certification) ──
create table if not exists public.certification_quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Job Readiness Certification',
  description text default '',
  status text not null default 'draft' check (status in ('draft','scheduled','published','archived')),
  scheduled_at timestamptz,
  time_limit_minutes integer not null default 45,
  questions_per_attempt integer not null default 40,
  passing_score integer not null default 80,
  randomize_questions boolean not null default true,
  randomize_answers boolean not null default true,
  first_attempt_requires_ad boolean not null default true,
  unlock_ads_required integer not null default 1,
  retake_cooldown_minutes integer not null default 120,
  retake_ads_required integer not null default 5,
  suspicious_seconds integer not null default 60, -- flag completions faster than this
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Question bank (target 500+; a random subset is served per attempt) ──────
create table if not exists public.certification_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.certification_quizzes(id) on delete cascade,
  type text not null default 'multiple_choice'
    check (type in ('multiple_choice','true_false','scenario')),
  prompt text not null,
  options jsonb not null default '[]'::jsonb,   -- ["A","B","C","D"]
  correct_answer text not null,                 -- must equal one option exactly
  explanation text default '',
  difficulty text not null default 'intermediate'
    check (difficulty in ('beginner','intermediate','advanced','expert','master')),
  course_category text default 'general',
  topic text default '',
  tags text[] default '{}',
  estimated_seconds integer not null default 60,
  weight numeric not null default 1,
  randomize_answers boolean not null default true,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  source text not null default 'manual' check (source in ('manual','import','ai')),
  ai_reviewed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cert_questions_quiz on public.certification_questions(quiz_id);
create index if not exists idx_cert_questions_status on public.certification_questions(status);
create index if not exists idx_cert_questions_category on public.certification_questions(course_category);
create index if not exists idx_cert_quizzes_status on public.certification_quizzes(status);

-- Only one published certification at a time (partial unique index).
create unique index if not exists uniq_cert_quiz_published
  on public.certification_quizzes((status)) where status = 'published';

-- updated_at triggers (reuse touch_updated_at() from 005).
drop trigger if exists trg_cert_quizzes_updated on public.certification_quizzes;
create trigger trg_cert_quizzes_updated before update on public.certification_quizzes
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_cert_questions_updated on public.certification_questions;
create trigger trg_cert_questions_updated before update on public.certification_questions
  for each row execute function public.touch_updated_at();

-- ─── Answer-order shuffler (used by the RPCs in 018) ────────────────────────
create or replace function public.jsonb_shuffle(arr jsonb)
returns jsonb language sql volatile set search_path = public as $$
  select coalesce(jsonb_agg(elem order by random()), '[]'::jsonb)
  from jsonb_array_elements(arr) elem;
$$;

-- ─── RLS ────────────────────────────────────────────────────────────────────
-- certification_quizzes: authenticated may read the PUBLISHED config (no answers
-- live here); admins read all + full write.
alter table public.certification_quizzes enable row level security;
drop policy if exists cert_quizzes_read on public.certification_quizzes;
create policy cert_quizzes_read on public.certification_quizzes for select
  using (status = 'published' or public.is_admin());
drop policy if exists cert_quizzes_write on public.certification_quizzes;
create policy cert_quizzes_write on public.certification_quizzes for all
  using (public.is_admin()) with check (public.is_admin());

-- certification_questions: ADMIN ONLY. No authenticated read policy → the bank
-- (with correct answers) is invisible to the mobile app. RPCs (SECURITY DEFINER)
-- are the only path that serves sanitized questions to learners.
alter table public.certification_questions enable row level security;
drop policy if exists cert_questions_admin on public.certification_questions;
create policy cert_questions_admin on public.certification_questions for all
  using (public.is_admin()) with check (public.is_admin());

-- ─── Seed the live certification (published) so the flow works out of the box.
-- questions_per_attempt = 20 so the 40-question seed bank demonstrates random
-- subset selection. Admins can edit all of this in the dashboard.
insert into public.certification_quizzes
  (id, title, description, status, questions_per_attempt, passing_score, time_limit_minutes)
values
  ('c0000000-0000-4000-8000-000000000001',
   'Job Readiness Certification',
   'Prove you understand the material and become eligible to apply for remote jobs.',
   'published', 20, 80, 45)
on conflict (id) do nothing;
