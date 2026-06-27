-- ============================================================================
-- 007_lesson_pdf.sql
-- Lessons & quizzes can carry an uploaded PDF (in Supabase Storage) in addition
-- to pasted text content. Adds pdf_url/pdf_name + a 'pdf' lesson type.
-- ============================================================================

alter table public.cms_lessons add column if not exists pdf_url text;
alter table public.cms_lessons add column if not exists pdf_name text;
alter table public.cms_quizzes add column if not exists pdf_url text;
alter table public.cms_quizzes add column if not exists pdf_name text;

-- Allow a dedicated 'pdf' lesson type.
alter table public.cms_lessons drop constraint if exists cms_lessons_type_check;
alter table public.cms_lessons add constraint cms_lessons_type_check
  check (type in ('text','video','image','code','exercise','checklist','resources','pdf'));
