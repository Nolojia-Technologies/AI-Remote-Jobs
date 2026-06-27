-- ============================================================================
-- 014_pdf_lessons.sql  —  Native PDF lessons (render the real PDF, no download)
-- Idempotent. Run in the Supabase SQL editor.
--
-- A lesson is either 'rich_text' (content_html) or 'pdf' (rendered page-by-page
-- from a PRIVATE bucket, streamed only through the pdf-proxy Edge Function).
-- The pdf_path is NEVER sent to the app.
-- ============================================================================

alter table public.cms_lessons add column if not exists lesson_type text not null default 'rich_text';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cms_lessons_lesson_type_chk') then
    alter table public.cms_lessons add constraint cms_lessons_lesson_type_chk check (lesson_type in ('rich_text', 'pdf'));
  end if;
end $$;
alter table public.cms_lessons add column if not exists pdf_path text;
alter table public.cms_lessons add column if not exists pdf_pages integer;

-- Page resume for PDF lessons.
alter table public.user_progress add column if not exists current_page integer default 0;
alter table public.user_progress add column if not exists total_pages integer default 0;

-- Private bucket for student-streamable native PDFs (separate from the admin
-- 'course-pdfs' text-extraction source). Reads happen only via the Edge
-- Function using the service role; no public access.
insert into storage.buckets (id, name, public)
values ('lesson-pdfs', 'lesson-pdfs', false)
on conflict (id) do nothing;

drop policy if exists lesson_pdfs_admin_all on storage.objects;
create policy lesson_pdfs_admin_all on storage.objects
  for all to authenticated
  using (bucket_id = 'lesson-pdfs' and public.is_admin())
  with check (bucket_id = 'lesson-pdfs' and public.is_admin());
