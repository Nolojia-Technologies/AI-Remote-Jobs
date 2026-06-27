# AI Remote Jobs

**Learn AI skills. Unlock remote opportunities.**

A full-stack learning platform that teaches practical AI and remote-work skills and gates real remote-work "opportunities" behind demonstrated learning. Built primarily for learners in Kenya 🇰🇪, Qatar 🇶🇦, Africa 🌍, and the global remote workforce.

This repo contains two apps that share one Supabase backend:

| Path | App | Stack |
|------|-----|-------|
| `/` (root) | **Mobile app** (learners) | Expo SDK 54 / React Native, Expo Router v6, NativeWind v4, Zustand v5 |
| `/admin` | **Admin portal** (content + ops) | Next.js 15 (App Router), Supabase service role, OpenAI / Anthropic |
| `/supabase` | **Database** | Postgres migrations (run in the Supabase SQL editor) |

---

## Features

**Learning experience**
- Gamified, gated progression — energy, daily limits, level locks, quiz gates, streaks, XP economy.
- A premium course/PDF reader: auto-calculated minimum reading time, ≥90% scroll, anti-skip engaged-time tracking, 10s autosave + resume.
- **Cooldown + rewarded-ad gate** between lessons, sequential unlocking, and **chapter mini-quiz gating** (pass to unlock the next block).
- **PDF → structured lessons**: admins upload a PDF and the system AI-restructures its *actual content* into native, section-based lessons (the PDF is a content source, not a viewer — fidelity-preserving, no fabricated facts).
- Spaced revision (SM-2), achievements, certificates, and global/Kenya/Qatar leaderboards.

**Opportunities & monetization**
- Course-gated remote-work opportunities ("jobs") that unlock as learners progress.
- Ad Intelligence Engine (rewarded / interstitial / app-open / banner / native) with engagement-aware decisions and AdMob ↔ Meta mediation.
- Engagement-gated, non-intrusive Play Store rating prompts.

**Platform**
- Google Sign-In + email/password auth (Supabase).
- Local engagement notifications with deep links (Android channels for heads-up delivery).
- Admin portal: courses, lessons, quizzes, jobs, media, users, analytics, AI generation, and a runtime-configurable **AI APIs** page (choose provider + paste keys, no redeploy).

---

## Getting started

### Prerequisites
- Node.js 20+
- A Supabase project (URL + keys)
- For native builds: an Expo account + EAS CLI; Android SDK / JDK 17 for local Gradle builds

### 1. Mobile app (root)
```bash
npm install
cp .env.example .env      # then fill in your values
npx expo start            # press 'a' for Android, or scan the QR in Expo Go
```
> Native modules (AdMob, Google Sign-In, etc.) are stubbed in Expo Go and only run in a dev/EAS build.

### 2. Admin portal (`/admin`)
```bash
cd admin
npm install
cp .env.example .env.local   # add Supabase URL + service-role key, and an AI key
npm run dev                  # http://localhost:3000
```

### 3. Database
Run the SQL files in `supabase/migrations/` **in order** in the Supabase SQL editor (they are idempotent), then `supabase/seed.sql` for sample data.

---

## Environment variables

Never commit real secrets — `.env` and `admin/.env.local` are gitignored. See `.env.example` / `admin/.env.example` for the full list.

- The Supabase **anon** key is public by design (client-side, protected by RLS).
- The **service-role** key and AI keys are server-only (admin portal).
- AI provider keys can also be set at runtime from the admin **AI APIs** page (stored in the service-role-only `ai_settings` table), which overrides env values.

---

## Builds (EAS)

```bash
eas build --platform android --profile preview      # APK (internal / testing)
eas build --platform android --profile production   # AAB (Play Store upload)
```
Profiles live in `eas.json`. Local Gradle builds are also supported from `android/`
(`./gradlew assembleRelease` for an APK, `./gradlew bundleRelease` for an AAB).

---

## Project structure

```
app/                 Expo Router screens (tabs, auth, onboarding, course, chapter, jobs, revision…)
src/
  ads/               Ad Intelligence Engine + mediation
  components/        UI + feature components
  hooks/  stores/    Zustand state + reusable hooks
  learning/          progression + course-gate logic
  notifications/     local notifications + deep links
  rating/            Play Store rating prompt system
  revision/          spaced-repetition (SM-2)
  services/  lib/    Supabase access + utilities
supabase/migrations/ Postgres schema (001 … 015)
admin/               Next.js admin portal (courses, jobs, AI generation, AI APIs…)
```

---

## License

© Nolojia Technologies. All rights reserved.
