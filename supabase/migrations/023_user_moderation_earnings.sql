-- ============================================================================
-- 023_user_moderation_earnings.sql — admin user deactivation + earnings view
-- Idempotent.
--
--  • profiles.is_disabled — set by the admin portal alongside a Supabase auth
--    ban (auth blocks sign-in/refresh; the flag makes it visible/filterable
--    and lets the app sign out an already-open session).
--  • admin_user_overview now includes is_disabled + wallet earnings so the
--    dashboard can rank the highest-earning users.
-- ============================================================================

alter table public.profiles add column if not exists is_disabled boolean not null default false;

drop view if exists public.admin_user_overview;
create view public.admin_user_overview
with (security_invoker = true) as
select
  p.id,
  p.email,
  p.full_name,
  p.country,
  p.level,
  p.xp,
  p.is_admin,
  p.is_disabled,
  p.created_at,
  coalesce(w.balance_cents, 0)  as balance_cents,
  coalesce(w.lifetime_cents, 0) as lifetime_cents,
  coalesce(w.referral_cents, 0) as referral_cents,
  greatest(
    (select max(up.updated_at)  from public.user_progress up          where up.user_id = p.id),
    (select max(ca.started_at)  from public.certification_attempts ca where ca.user_id = p.id),
    (select max(a.created_at)   from public.ai_task_attempts a        where a.user_id = p.id)
  ) as last_seen
from public.profiles p
left join public.wallets w on w.user_id = p.id;

revoke all on public.admin_user_overview from anon, authenticated;
grant select on public.admin_user_overview to service_role;
