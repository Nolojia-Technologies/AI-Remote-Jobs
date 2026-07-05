-- ============================================================================
-- 017_certification_state.sql  —  Attempts, per-attempt questions, gate, results
-- Idempotent. Run in the Supabase SQL editor. Depends on 016.
--
-- These tables are written ONLY by the SECURITY DEFINER RPCs in 018. RLS lets a
-- user read their OWN attempt status / gate / eligibility (no answer keys are
-- exposed to the client — the answer key lives in certification_attempt_questions
-- which is admin-only and served post-submit via cert_review()).
-- ============================================================================

-- ─── Attempts ───────────────────────────────────────────────────────────────
create table if not exists public.certification_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references public.certification_quizzes(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress','submitted','expired')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  submitted_at timestamptz,
  total_questions integer not null default 0,
  score numeric,
  percentage integer,
  passed boolean,
  correct_count integer,
  incorrect_count integer,
  skipped_count integer,
  seconds_taken integer,
  flagged_suspicious boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_cert_attempts_user on public.certification_attempts(user_id);
-- At most ONE in-progress attempt per user (blocks concurrent sessions).
create unique index if not exists uniq_cert_attempt_in_progress
  on public.certification_attempts(user_id) where status = 'in_progress';

-- ─── Per-attempt served questions (frozen order + frozen answer order) ───────
-- correct_answer is snapshotted here for resilient server-side scoring; this
-- table is admin-only under RLS and never selected by the client directly.
create table if not exists public.certification_attempt_questions (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.certification_attempts(id) on delete cascade,
  question_id uuid not null references public.certification_questions(id) on delete cascade,
  order_index integer not null default 0,
  served_options jsonb not null default '[]'::jsonb, -- possibly shuffled options shown to the user
  correct_answer text not null,
  weight numeric not null default 1,
  selected_answer text,
  is_correct boolean,
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);
create index if not exists idx_cert_aq_attempt on public.certification_attempt_questions(attempt_id);

-- ─── Gate: unlock-ad / retake-cooldown state per user ───────────────────────
-- attempts_used = 0 → first attempt (needs `unlock_ads_required` ads, default 1).
-- attempts_used >= 1 → retake (ready when cooldown passes OR `retake_ads_required`
-- ads watched). `ads_watched` resumes progress if the user leaves and returns.
create table if not exists public.certification_gate (
  user_id uuid primary key references auth.users(id) on delete cascade,
  attempts_used integer not null default 0,
  cooldown_until timestamptz,
  ads_watched integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ─── Job eligibility (the single source jobs read) ──────────────────────────
create table if not exists public.job_eligibility (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_job_ready boolean not null default false,
  certified_at timestamptz,
  certification_score numeric,
  certification_percentage integer,
  updated_at timestamptz not null default now()
);

-- ─── RLS: owner-read on status tables; all writes happen via definer RPCs ────
alter table public.certification_attempts enable row level security;
drop policy if exists cert_attempts_own_read on public.certification_attempts;
create policy cert_attempts_own_read on public.certification_attempts for select
  using (auth.uid() = user_id or public.is_admin());

-- Per-attempt questions: ADMIN ONLY (holds the answer key). Learners receive
-- sanitized questions via cert_start_attempt/cert_get_active_attempt and the
-- post-submit review via cert_review — never by selecting this table.
alter table public.certification_attempt_questions enable row level security;
drop policy if exists cert_aq_admin on public.certification_attempt_questions;
create policy cert_aq_admin on public.certification_attempt_questions for all
  using (public.is_admin()) with check (public.is_admin());

alter table public.certification_gate enable row level security;
drop policy if exists cert_gate_own_read on public.certification_gate;
create policy cert_gate_own_read on public.certification_gate for select
  using (auth.uid() = user_id or public.is_admin());

alter table public.job_eligibility enable row level security;
drop policy if exists job_eligibility_own_read on public.job_eligibility;
create policy job_eligibility_own_read on public.job_eligibility for select
  using (auth.uid() = user_id or public.is_admin());
