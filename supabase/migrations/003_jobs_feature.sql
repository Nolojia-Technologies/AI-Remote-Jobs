-- ============================================================
-- AI Hustle Academy — Remote Jobs feature
-- Run in the Supabase SQL Editor after 001 & 002.
--
-- The app drives the job CATALOG from local mock data
-- (src/data/jobs.ts), so these tables store per-user state and an
-- optional admin-managed catalog for future production use.
-- job_id is TEXT to match the mock catalog ids (e.g. 'job-001').
-- All per-user tables are safe to run even before the catalog exists.
-- ============================================================

-- ─── Saved / bookmarked jobs ─────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_jobs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, job_id)
);
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own saved_jobs select" ON saved_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own saved_jobs insert" ON saved_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own saved_jobs delete" ON saved_jobs FOR DELETE USING (auth.uid() = user_id);

-- ─── Job views ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_views (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id    TEXT NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE job_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own job_views select" ON job_views FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own job_views insert" ON job_views FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── Job applications ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_applications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id          TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'applied'
                    CHECK (status IN ('applied','reviewed','shortlisted','accepted','rejected')),
  match_score     INTEGER NOT NULL DEFAULT 0,
  resume_snapshot TEXT,
  applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, job_id)
);
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own applications select" ON job_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own applications insert" ON job_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own applications update" ON job_applications FOR UPDATE USING (auth.uid() = user_id);

-- ─── Job unlocks (so the +100 XP reward is granted once) ─────
CREATE TABLE IF NOT EXISTS job_unlocks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id      TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, job_id)
);
ALTER TABLE job_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own job_unlocks select" ON job_unlocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own job_unlocks insert" ON job_unlocks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── Daily job check-in rewards (one per user per day) ───────
CREATE TABLE IF NOT EXISTS daily_job_rewards (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_date DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, reward_date)
);
ALTER TABLE daily_job_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own daily_job_rewards select" ON daily_job_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own daily_job_rewards insert" ON daily_job_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── Optional admin-managed catalog (for future admin panel) ─
CREATE TABLE IF NOT EXISTS job_categories (
  id    TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '💼',
  color TEXT NOT NULL DEFAULT '#2563EB'
);
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read job_categories" ON job_categories FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS jobs (
  id                  TEXT PRIMARY KEY,
  title               TEXT NOT NULL,
  company             TEXT NOT NULL,
  company_logo        TEXT,
  category_id         TEXT REFERENCES job_categories(id),
  country             TEXT,
  country_flag        TEXT,
  salary_min          INTEGER,
  salary_max          INTEGER,
  salary_currency     TEXT DEFAULT 'USD',
  remote_type         TEXT DEFAULT 'remote',
  employment_type     TEXT DEFAULT 'full_time',
  difficulty          TEXT DEFAULT 'beginner',
  posted_at           TIMESTAMPTZ DEFAULT NOW(),
  featured            BOOLEAN DEFAULT false,
  featured_tag        TEXT,
  description         TEXT,
  responsibilities    JSONB,
  benefits            JSONB,
  company_description TEXT,
  skills              JSONB,
  application_deadline TIMESTAMPTZ,
  -- unlock requirements
  required_module_ids JSONB DEFAULT '[]',
  required_courses    JSONB DEFAULT '[]',
  min_xp              INTEGER DEFAULT 0,
  min_level           INTEGER DEFAULT 1,
  min_streak_days     INTEGER DEFAULT 0,
  completion_percent  INTEGER DEFAULT 80,
  requires_final_quiz BOOLEAN DEFAULT false,
  is_active           BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read active jobs" ON jobs FOR SELECT USING (is_active = true);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_views_user ON job_views(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_job_rewards_user ON daily_job_rewards(user_id, reward_date);
