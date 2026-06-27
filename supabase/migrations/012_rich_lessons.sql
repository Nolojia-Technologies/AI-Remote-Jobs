-- ============================================================================
-- 012_rich_lessons.sql  —  Rich-text lesson content (HTML + Tiptap JSON)
-- Idempotent. Run in the Supabase SQL editor.
--
-- The portal lesson editor (Tiptap) now stores rich content as HTML + a Tiptap
-- JSON document. The mobile app renders content_html in a WebView; lessons that
-- only have markdown `body` (AI-generated / seeded) keep rendering as before.
-- ============================================================================

-- Rich HTML output (what the mobile WebView + portal preview render).
alter table public.cms_lessons add column if not exists content_html text;

-- `content` jsonb already exists (migration 006) — reused for the Tiptap JSON
-- document so the editor can re-open content losslessly. Nothing to add.

-- Reading-time columns (re-assert so the editor's autosave is safe even on
-- environments where 011 wasn't applied).
alter table public.cms_lessons add column if not exists character_count integer default 0;
alter table public.cms_lessons add column if not exists estimated_reading_minutes integer default 1;
