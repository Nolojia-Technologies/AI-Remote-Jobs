-- ============================================================================
-- 021_completed_courses.sql  —  Count fully-completed courses per user
-- Idempotent. Run in the Supabase SQL editor.
--
-- Drives the "partial job unlock": completing N courses unlocks the first few
-- jobs even before full certification. A course counts as complete when EVERY
-- published lesson in it has a 'completed' user_progress row for the caller.
-- ============================================================================

create or replace function public.get_completed_courses_count()
returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int from (
    select c.id,
      count(l.id) as total,
      count(*) filter (where up.status = 'completed') as done
    from public.courses c
    join public.cms_lessons l on l.course_id = c.id and l.status = 'published'
    left join public.user_progress up on up.lesson_id = l.id and up.user_id = auth.uid()
    where c.status = 'published'
    group by c.id
  ) t
  where t.total > 0 and t.done >= t.total;
$$;

grant execute on function public.get_completed_courses_count() to authenticated;
