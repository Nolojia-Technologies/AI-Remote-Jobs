-- ============================================================================
-- 011_reading_progress.sql  —  Smart lesson completion + reading progress
-- Idempotent. Run in the Supabase SQL editor.
--
--  • cms_lessons: store character_count + estimated_reading_minutes (backfilled).
--  • user_progress: add reading-engagement columns and DROP the stale FKs that
--    pointed lesson_id/chapter_id at the LEGACY lessons/chapters tables (the app
--    uses cms_lessons/cms_chapters ids, so those FKs could reject progress writes).
-- ============================================================================

-- ─── cms_lessons: reading-time metadata ─────────────────────────────────────
alter table public.cms_lessons add column if not exists character_count integer default 0;
alter table public.cms_lessons add column if not exists estimated_reading_minutes integer default 1;

update public.cms_lessons
set character_count = coalesce(char_length(body), 0),
    estimated_reading_minutes = greatest(1, ceil(coalesce(char_length(body), 0) / 1000.0))::int
where character_count is null
   or character_count <> coalesce(char_length(body), 0);

-- ─── user_progress: relax legacy FKs, add engagement columns ────────────────
alter table public.user_progress drop constraint if exists user_progress_lesson_id_fkey;
alter table public.user_progress drop constraint if exists user_progress_chapter_id_fkey;

alter table public.user_progress add column if not exists time_spent_seconds integer not null default 0;
alter table public.user_progress add column if not exists scroll_percentage integer not null default 0;
alter table public.user_progress add column if not exists last_scroll_position integer not null default 0;
alter table public.user_progress add column if not exists started_at timestamptz;
alter table public.user_progress add column if not exists completed_at timestamptz;
alter table public.user_progress add column if not exists quiz_score integer;

-- status already exists (default 'in_progress'); normalise allowed values.
update public.user_progress set status = 'in_progress' where status is null;
