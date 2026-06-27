-- ============================================================================
-- 013_pdf_import.sql  —  PDF course upload (private storage + import records)
-- Idempotent. Run in the Supabase SQL editor.
--
-- The uploaded PDF is the SOURCE only — learners never see it. It lives in a
-- PRIVATE bucket; lessons store the extracted content_html. Admin-only access.
-- ============================================================================

-- Private bucket — not publicly readable.
insert into storage.buckets (id, name, public)
values ('course-pdfs', 'course-pdfs', false)
on conflict (id) do nothing;

-- Admin-only access to objects in that bucket (anon/students get nothing; the
-- server uses the service-role client which bypasses RLS for processing).
drop policy if exists course_pdfs_admin_all on storage.objects;
create policy course_pdfs_admin_all on storage.objects
  for all to authenticated
  using (bucket_id = 'course-pdfs' and public.is_admin())
  with check (bucket_id = 'course-pdfs' and public.is_admin());

-- Import records (list / replace / delete / reprocess).
create table if not exists public.course_pdfs (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  size_bytes bigint default 0,
  status text not null default 'processed',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_course_pdfs_course on public.course_pdfs(course_id);

alter table public.course_pdfs enable row level security;
drop policy if exists course_pdfs_admin on public.course_pdfs;
create policy course_pdfs_admin on public.course_pdfs
  for all using (public.is_admin()) with check (public.is_admin());
