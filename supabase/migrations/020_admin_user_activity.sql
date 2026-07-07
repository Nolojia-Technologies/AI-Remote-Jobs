-- ============================================================================
-- 020_admin_user_activity.sql  —  Admin-only per-user activity + tenure view
-- Idempotent. Run in the Supabase SQL editor.
--
-- The mobile app logs analytics to Firebase (not the Supabase analytics_events
-- table) and does not maintain profiles.last_active_at, so the reliable, app-
-- written "last seen" signal is the newest of:
--   • user_progress.updated_at        (every lesson read / completion autosave)
--   • certification_attempts.started_at (starting the Job Readiness quiz)
--
-- This view surfaces last_seen (for active/live filtering) alongside created_at
-- (account tenure = "how long they've used the app"). Read ONLY by the admin
-- service-role client. No mobile-app changes.
-- ============================================================================

create or replace view public.admin_user_overview
with (security_invoker = true) as
select
  p.id,
  p.email,
  p.full_name,
  p.country,
  p.level,
  p.xp,
  p.is_admin,
  p.created_at,
  greatest(
    (select max(up.updated_at)  from public.user_progress up          where up.user_id = p.id),
    (select max(ca.started_at)  from public.certification_attempts ca where ca.user_id = p.id)
  ) as last_seen
from public.profiles p;

-- Restrict to the privileged server client (the dashboard reads it via the
-- service role). Not exposed to the mobile anon/authenticated roles.
revoke all on public.admin_user_overview from anon, authenticated;
grant select on public.admin_user_overview to service_role;
