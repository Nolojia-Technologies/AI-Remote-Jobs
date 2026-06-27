-- ============================================================
-- AI Hustle Academy — Social Proof system
-- OPTIONAL. The app computes all social-proof numbers client-side
-- (deterministic from job data + time, see src/lib/socialProof.ts),
-- so it works with NO database changes. These tables exist so a
-- future server/cron can drive real counts instead.
-- ============================================================

-- Authoritative applicant counts + growth (server/cron can increment).
CREATE TABLE IF NOT EXISTS job_applicant_counts (
  job_id          TEXT PRIMARY KEY,
  base_count      INTEGER NOT NULL DEFAULT 0,
  growth_per_hour INTEGER NOT NULL DEFAULT 1,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE job_applicant_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read applicant counts" ON job_applicant_counts FOR SELECT USING (true);

-- Live viewer snapshots (server pushes; clients read latest).
CREATE TABLE IF NOT EXISTS viewer_counts (
  job_id      TEXT PRIMARY KEY,
  viewers_now INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE viewer_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read viewer counts" ON viewer_counts FOR SELECT USING (true);

-- Aggregated per-job statistics for popularity/trending.
CREATE TABLE IF NOT EXISTS job_statistics (
  job_id           TEXT PRIMARY KEY,
  total_views      INTEGER NOT NULL DEFAULT 0,
  total_bookmarks  INTEGER NOT NULL DEFAULT 0,
  total_shares     INTEGER NOT NULL DEFAULT 0,
  total_applications INTEGER NOT NULL DEFAULT 0,
  popularity_score INTEGER NOT NULL DEFAULT 0,
  trending         BOOLEAN NOT NULL DEFAULT false,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE job_statistics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read job statistics" ON job_statistics FOR SELECT USING (true);

-- Global live activity feed (server generates realistic events).
CREATE TABLE IF NOT EXISTS live_activity (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_name TEXT NOT NULL,
  country    TEXT,
  action     TEXT NOT NULL,
  job_id     TEXT,
  emoji      TEXT DEFAULT '👤',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE live_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read live activity" ON live_activity FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_live_activity_created ON live_activity(created_at DESC);
