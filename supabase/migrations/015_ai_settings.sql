-- ============================================================================
-- 015_ai_settings.sql  —  Runtime-editable AI provider settings (admin only)
-- Idempotent. Run in the Supabase SQL editor.
--
-- Lets an admin pick the AI provider and paste API keys / model names from the
-- portal UI instead of editing env vars + redeploying. The AI layer reads this
-- row at request time (falling back to env when a field is blank).
--
-- SECURITY: this row holds API KEYS. Row Level Security is ENABLED with NO
-- policies, so only the service-role key (used by the admin portal server) can
-- read or write it. The mobile app never touches this table.
-- ============================================================================

create table if not exists public.ai_settings (
  id text primary key default 'default',
  provider text not null default 'openai',
  openai_api_key text,
  openai_model text,
  openai_image_model text,
  anthropic_api_key text,
  anthropic_model text,
  updated_at timestamptz not null default now(),
  updated_by text
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ai_settings_provider_chk') then
    alter table public.ai_settings add constraint ai_settings_provider_chk check (provider in ('openai', 'anthropic'));
  end if;
end $$;

-- Single-row table: seed the 'default' row.
insert into public.ai_settings (id) values ('default') on conflict (id) do nothing;

-- Secrets: RLS on, NO policies → service-role only (everyone else denied).
alter table public.ai_settings enable row level security;
