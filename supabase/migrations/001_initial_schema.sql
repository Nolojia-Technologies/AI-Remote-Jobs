-- ============================================================
-- AI Hustle Academy — Initial Database Schema
-- Supabase PostgreSQL Migration 001
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT,
  avatar_url      TEXT,
  career_path_id  TEXT,
  goal            TEXT,
  xp              INTEGER NOT NULL DEFAULT 0,
  level           INTEGER NOT NULL DEFAULT 1,
  streak_days     INTEGER NOT NULL DEFAULT 0,
  streak_last_date TIMESTAMPTZ,
  country         TEXT,
  push_token      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow leaderboard reads (public read of selected columns via view)
CREATE POLICY "Anyone can view profiles for leaderboard"
  ON profiles FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────
-- CAREER PATHS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE career_paths (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#2563EB',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE career_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view career paths" ON career_paths FOR SELECT USING (is_active = true);

-- ─────────────────────────────────────────────────────────────
-- MODULES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE modules (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  career_path_id  TEXT NOT NULL REFERENCES career_paths(id),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  level           TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  order_index     INTEGER NOT NULL DEFAULT 0,
  xp_reward       INTEGER NOT NULL DEFAULT 100,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view modules" ON modules FOR SELECT USING (is_active = true);

-- ─────────────────────────────────────────────────────────────
-- LESSONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE lessons (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id        UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  content          TEXT NOT NULL,
  video_url        TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 5,
  order_index      INTEGER NOT NULL DEFAULT 0,
  xp_reward        INTEGER NOT NULL DEFAULT 20,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view lessons" ON lessons FOR SELECT USING (is_active = true);

-- ─────────────────────────────────────────────────────────────
-- USER LESSON PROGRESS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE user_lesson_progress (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id    UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed    BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, lesson_id)
);

ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lesson progress"
  ON user_lesson_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lesson progress"
  ON user_lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lesson progress"
  ON user_lesson_progress FOR UPDATE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- QUIZZES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE quizzes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id           UUID REFERENCES lessons(id),
  module_id           UUID REFERENCES modules(id),
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  pass_score          INTEGER NOT NULL DEFAULT 80,
  xp_reward           INTEGER NOT NULL DEFAULT 50,
  time_limit_seconds  INTEGER,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view quizzes" ON quizzes FOR SELECT USING (is_active = true);

-- ─────────────────────────────────────────────────────────────
-- QUIZ QUESTIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE quiz_questions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id        UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question       TEXT NOT NULL,
  question_type  TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'scenario')),
  options        JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation    TEXT,
  order_index    INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view quiz questions" ON quiz_questions FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────
-- USER QUIZ RESULTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE user_quiz_results (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id      UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score        INTEGER NOT NULL,
  passed       BOOLEAN NOT NULL,
  answers      JSONB NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz results"
  ON user_quiz_results FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz results"
  ON user_quiz_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- CHALLENGES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE challenges (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  instructions TEXT NOT NULL,
  category     TEXT NOT NULL,
  difficulty   TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  xp_reward    INTEGER NOT NULL DEFAULT 100,
  expires_at   TIMESTAMPTZ NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active challenges"
  ON challenges FOR SELECT USING (is_active = true AND expires_at > NOW());

-- ─────────────────────────────────────────────────────────────
-- CHALLENGE SUBMISSIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE challenge_submissions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id    UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  submission_text TEXT NOT NULL,
  score           INTEGER,
  feedback        TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'passed', 'failed')),
  xp_awarded      INTEGER NOT NULL DEFAULT 0,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, challenge_id)
);

ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own submissions"
  ON challenge_submissions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions"
  ON challenge_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- ACHIEVEMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE achievements (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  icon              TEXT NOT NULL DEFAULT '🏆',
  badge_color       TEXT NOT NULL DEFAULT '#F59E0B',
  xp_reward         INTEGER NOT NULL DEFAULT 100,
  requirement_type  TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────
-- USER ACHIEVEMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE user_achievements (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- CERTIFICATES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE certificates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  career_path_id  TEXT NOT NULL REFERENCES career_paths(id),
  certificate_id  TEXT NOT NULL UNIQUE,
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, career_path_id)
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certificates"
  ON certificates FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own certificates"
  ON certificates FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- OPPORTUNITIES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE opportunities (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  category          TEXT NOT NULL CHECK (category IN ('practice_project','ai_simulation','skill_challenge','mock_freelance','remote_job')),
  required_xp       INTEGER NOT NULL DEFAULT 0,
  required_level    INTEGER NOT NULL DEFAULT 1,
  required_quiz_id  UUID REFERENCES quizzes(id),
  required_course_id UUID REFERENCES modules(id),
  is_locked         BOOLEAN NOT NULL DEFAULT false,
  company           TEXT,
  location          TEXT,
  payout            TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view opportunities" ON opportunities FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────
-- XP LOGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE xp_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,
  source      TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE xp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own XP logs"
  ON xp_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own XP logs"
  ON xp_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  type       TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  data       JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- VIEWS
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW leaderboard_global AS
SELECT
  id AS user_id,
  full_name,
  avatar_url,
  xp,
  level,
  country,
  RANK() OVER (ORDER BY xp DESC) AS rank
FROM profiles
ORDER BY xp DESC;

-- ─────────────────────────────────────────────────────────────
-- FUNCTIONS
-- ─────────────────────────────────────────────────────────────

-- Auto-create profile on user signup.
-- NOTE: search_path MUST be pinned and the table schema-qualified — the trigger
-- fires as the supabase_auth_admin role, whose search_path excludes `public`.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, xp, level, streak_days)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    0,
    1,
    0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────────
-- INDEXES for performance
-- ─────────────────────────────────────────────────────────────
CREATE INDEX idx_profiles_xp ON profiles(xp DESC);
CREATE INDEX idx_profiles_country ON profiles(country);
CREATE INDEX idx_profiles_career_path ON profiles(career_path_id);
CREATE INDEX idx_modules_career_path ON modules(career_path_id);
CREATE INDEX idx_lessons_module ON lessons(module_id);
CREATE INDEX idx_user_lesson_progress_user ON user_lesson_progress(user_id);
CREATE INDEX idx_user_lesson_progress_lesson ON user_lesson_progress(lesson_id);
CREATE INDEX idx_challenges_active ON challenges(is_active, expires_at);
CREATE INDEX idx_challenge_submissions_user ON challenge_submissions(user_id);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_xp_logs_user ON xp_logs(user_id, created_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
