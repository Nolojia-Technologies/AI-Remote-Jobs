# AI Hustle Academy — Web Admin Portal

Next.js (App Router) + TypeScript + TailwindCSS + shadcn-style UI + Supabase + GPT-5.
Shares the **same Supabase project** as the mobile app — no duplicated data, nothing hardcoded.

## Setup

```bash
cd admin
npm install
cp .env.example .env.local   # fill in the values
npm run dev                  # http://localhost:3000
```

`.env.local`:

| Var | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Same project as the app |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only.** Privileged reads + AI writes |
| `AI_PROVIDER` | `openai` or `anthropic` (omit = auto-detect from the key present) |
| `ANTHROPIC_API_KEY` | **Server-only.** Claude generation (when `AI_PROVIDER=anthropic`) |
| `ANTHROPIC_MODEL` | Defaults to `claude-opus-4-8` |
| `OPENAI_API_KEY` | **Server-only.** GPT generation + AI thumbnails (images) |
| `OPENAI_MODEL` | Defaults to `gpt-5` |

> **GPT or Claude:** set `AI_PROVIDER` to choose. The layered generators dispatch
> through `lib/ai/provider.ts`; thumbnails always use OpenAI (Claude can't make
> images), so an `OPENAI_API_KEY` is needed for thumbnail generation regardless.

## Access control

Only emails in the `admin_emails` table can sign in. `middleware.ts` refreshes the
session and enforces the whitelist via the shared `is_admin()` RLS function on
every route; the dashboard layout re-checks server-side. Non-admins are signed
out and redirected to `/login?denied=1`.

Add an admin in Supabase:

```sql
insert into public.admin_emails (email) values ('you@example.com');
-- then create the auth user (Supabase Auth → Users) with a password.
```

## Database

Apply the migrations in `../supabase/migrations` (through `008`), then run
`009_portal_extend.sql` in the Supabase SQL editor.

## Structure

```
app/
  (dashboard)/        guarded portal — dashboard, courses, jobs, ai, users,
                      notifications, analytics, media, activity, settings
  api/ai/*            layered GPT-5 routes (structure→stage→lesson→quiz→
                      milestone→final + improve/translate/thumbnail)
  login/              Supabase email/password sign-in
lib/
  supabase/           server / client / middleware / service-role clients
  services/           typed CRUD per entity (write admin_activity)
  ai/                 openai client, prompts, zod schemas
  auth.ts             requireAdmin(), isAdmin(), logActivity()
components/ui/         shadcn-style primitives (no Radix dependency)
seed/ai-library/      authored curriculum carried over from the mobile app
```

## AI generation

Content is generated **in layers**, never one-shot, and saved as **draft** for
review before publishing. Each layer is an admin-only API route that validates
the model's JSON with zod before persisting via the services.
