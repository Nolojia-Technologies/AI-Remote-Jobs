-- ============================================================
-- AI Hustle Academy — AI Tasks & Earnings Hub
-- Run in the Supabase SQL Editor after 021.
--
-- Turns the Jobs tab into an earning hub: AI micro tasks,
-- captchas, data annotation, surveys, wallet, referrals,
-- task levels, daily limits and streaks.
--
-- SECURITY MODEL
--  • Answer keys live in ai_task_answers (no client SELECT policy).
--  • ALL rewards are credited by SECURITY DEFINER RPCs — the client
--    never writes wallets/transactions/attempts directly.
--  • Anti-fraud: per-task dedupe, minimum solve time, submission
--    rate limit, daily caps, ad-unlocked batch caps, referral
--    qualification (min tasks + account age) before payout.
-- ============================================================

-- ─── Task catalog ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_tasks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind           TEXT NOT NULL CHECK (kind IN ('microtask','captcha','annotation','survey')),
  category       TEXT NOT NULL,                 -- e.g. image_labeling, sentiment_analysis, captcha_text …
  title          TEXT NOT NULL,
  description    TEXT NOT NULL DEFAULT '',
  difficulty     TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard')),
  reward_cents   INTEGER NOT NULL DEFAULT 1 CHECK (reward_cents >= 0 AND reward_cents <= 500),
  xp             INTEGER NOT NULL DEFAULT 2 CHECK (xp >= 0 AND xp <= 100),
  est_seconds    INTEGER NOT NULL DEFAULT 30,
  content        JSONB NOT NULL DEFAULT '{}',   -- question payload shown to the user (NO answers here)
  repeatable     BOOLEAN NOT NULL DEFAULT false,
  min_task_level INTEGER NOT NULL DEFAULT 1 CHECK (min_task_level BETWEEN 1 AND 7),
  required_course_id TEXT,                      -- learning integration: course that unlocks this task
  status         TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','paused','archived')),
  order_index    INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE ai_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_tasks_read ON ai_tasks FOR SELECT
  USING (status = 'published' OR public.is_admin());
CREATE POLICY ai_tasks_admin ON ai_tasks FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Correct answers, kept out of client reach entirely (RPC-only).
CREATE TABLE IF NOT EXISTS ai_task_answers (
  task_id    UUID PRIMARY KEY REFERENCES ai_tasks(id) ON DELETE CASCADE,
  answer     JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE ai_task_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_task_answers_admin ON ai_task_answers FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ─── Attempts (audit trail; written only by RPC) ─────────────
CREATE TABLE IF NOT EXISTS ai_task_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id      UUID NOT NULL REFERENCES ai_tasks(id) ON DELETE CASCADE,
  answer       JSONB,
  correct      BOOLEAN,
  status       TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved','pending','rejected')),
  reward_cents INTEGER NOT NULL DEFAULT 0,
  xp           INTEGER NOT NULL DEFAULT 0,
  duration_ms  INTEGER NOT NULL DEFAULT 0,
  client_nonce TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attempts_user_day ON ai_task_attempts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_attempts_task ON ai_task_attempts(task_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_attempts_nonce ON ai_task_attempts(user_id, client_nonce)
  WHERE client_nonce IS NOT NULL;
ALTER TABLE ai_task_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY attempts_own_read ON ai_task_attempts FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());
-- no INSERT/UPDATE policies: only the SECURITY DEFINER RPC writes here

-- ─── Wallet ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallets (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_cents    INTEGER NOT NULL DEFAULT 0,
  pending_cents    INTEGER NOT NULL DEFAULT 0,
  lifetime_cents   INTEGER NOT NULL DEFAULT 0,
  task_cents       INTEGER NOT NULL DEFAULT 0,
  survey_cents     INTEGER NOT NULL DEFAULT 0,
  referral_cents   INTEGER NOT NULL DEFAULT 0,
  bonus_cents      INTEGER NOT NULL DEFAULT 0,
  task_streak_days INTEGER NOT NULL DEFAULT 0,
  task_streak_best INTEGER NOT NULL DEFAULT 0,
  task_streak_date DATE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY wallets_own_read ON wallets FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY wallets_admin_write ON wallets FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('task','captcha','annotation','survey','referral','bonus','withdrawal','adjustment')),
  status       TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','pending','rejected')),
  description  TEXT NOT NULL DEFAULT '',
  ref_id       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wtx_user ON wallet_transactions(user_id, created_at DESC);
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY wtx_own_read ON wallet_transactions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY wtx_admin_write ON wallet_transactions FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ─── Daily stats & ad-unlocked batches ───────────────────────
CREATE TABLE IF NOT EXISTS task_daily_stats (
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day              DATE NOT NULL,
  tasks_completed  INTEGER NOT NULL DEFAULT 0,
  captchas_completed INTEGER NOT NULL DEFAULT 0,
  earned_cents     INTEGER NOT NULL DEFAULT 0,
  xp_earned        INTEGER NOT NULL DEFAULT 0,
  ad_batches       INTEGER NOT NULL DEFAULT 0,   -- extra batches unlocked via rewarded ads
  PRIMARY KEY (user_id, day)
);
ALTER TABLE task_daily_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY tds_own_read ON task_daily_stats FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- ─── Referrals ───────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
UPDATE public.profiles
  SET referral_code = UPPER(SUBSTRING(MD5(id::text || 'aihustle') FROM 1 FOR 8))
  WHERE referral_code IS NULL;

CREATE TABLE IF NOT EXISTS referrals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id   UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','qualified','rewarded')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qualified_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY referrals_read ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id OR public.is_admin());

-- ─── Economy constants (single source of truth server-side) ──
CREATE OR REPLACE FUNCTION public.earn_config()
RETURNS JSONB LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_build_object(
    'free_daily_tasks',     100,   -- free tasks per day
    'batch_size',           25,    -- tasks per segment
    'max_ad_batches',       6,     -- rewarded-ad batches per day
    'captcha_daily_cap',    150,   -- captcha completions per day
    'min_solve_ms',         1500,  -- absolute floor per submission
    'rate_limit_ms',        2000,  -- min gap between submissions
    'referrer_reward_cents', 50,
    'referee_bonus_cents',   10,
    'referral_min_tasks',    5,    -- referee tasks before payout
    'referral_min_days',     3     -- referee account age before payout
  );
$$;

-- Task level from lifetime approved attempts:
-- 1 Beginner 0+ · 2 Bronze 50+ · 3 Silver 150+ · 4 Gold 400+
-- 5 Platinum 1000+ · 6 Expert 2500+ · 7 Master 6000+
CREATE OR REPLACE FUNCTION public.get_task_level(p_user UUID)
RETURNS INTEGER LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN n >= 6000 THEN 7 WHEN n >= 2500 THEN 6 WHEN n >= 1000 THEN 5
    WHEN n >= 400 THEN 4 WHEN n >= 150 THEN 3 WHEN n >= 50 THEN 2 ELSE 1 END
  FROM (SELECT COUNT(*) AS n FROM ai_task_attempts
        WHERE user_id = p_user AND status = 'approved') s;
$$;

-- ─── Internal: credit a wallet + write the transaction ───────
CREATE OR REPLACE FUNCTION public._credit_wallet(
  p_user UUID, p_cents INTEGER, p_type TEXT, p_desc TEXT, p_ref TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO wallets (user_id) VALUES (p_user) ON CONFLICT (user_id) DO NOTHING;
  UPDATE wallets SET
    balance_cents  = balance_cents + p_cents,
    lifetime_cents = lifetime_cents + GREATEST(p_cents, 0),
    task_cents     = task_cents + CASE WHEN p_type IN ('task','captcha','annotation') THEN p_cents ELSE 0 END,
    survey_cents   = survey_cents + CASE WHEN p_type = 'survey' THEN p_cents ELSE 0 END,
    referral_cents = referral_cents + CASE WHEN p_type = 'referral' THEN p_cents ELSE 0 END,
    bonus_cents    = bonus_cents + CASE WHEN p_type = 'bonus' THEN p_cents ELSE 0 END,
    updated_at     = NOW()
  WHERE user_id = p_user;
  INSERT INTO wallet_transactions (user_id, amount_cents, type, description, ref_id)
  VALUES (p_user, p_cents, p_type, p_desc, p_ref);
END;
$$;

-- ─── Internal: referral qualification check ──────────────────
CREATE OR REPLACE FUNCTION public._check_referral_qualification(p_referee UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r RECORD;
  cfg JSONB := public.earn_config();
  task_count INTEGER;
  account_days NUMERIC;
BEGIN
  SELECT * INTO r FROM referrals WHERE referee_id = p_referee AND status = 'pending';
  IF NOT FOUND THEN RETURN; END IF;

  SELECT COUNT(*) INTO task_count FROM ai_task_attempts
    WHERE user_id = p_referee AND status = 'approved';
  SELECT EXTRACT(EPOCH FROM (NOW() - u.created_at)) / 86400 INTO account_days
    FROM auth.users u WHERE u.id = p_referee;

  IF task_count >= (cfg->>'referral_min_tasks')::int
     AND account_days >= (cfg->>'referral_min_days')::numeric THEN
    UPDATE referrals SET status = 'rewarded', qualified_at = NOW() WHERE id = r.id;
    PERFORM public._credit_wallet(r.referrer_id, (cfg->>'referrer_reward_cents')::int,
      'referral', 'Referral qualified — friend is now active', r.id::text);
    PERFORM public._credit_wallet(p_referee, (cfg->>'referee_bonus_cents')::int,
      'bonus', 'Welcome bonus — referral qualified', r.id::text);
  END IF;
END;
$$;

-- ─── RPC: apply a referral code (once, after signup) ─────────
CREATE OR REPLACE FUNCTION public.apply_referral_code(p_code TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me UUID := auth.uid();
  referrer UUID;
BEGIN
  IF me IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Not signed in'); END IF;
  SELECT id INTO referrer FROM profiles WHERE referral_code = UPPER(TRIM(p_code));
  IF referrer IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Invalid code'); END IF;
  IF referrer = me THEN RETURN jsonb_build_object('ok', false, 'error', 'You cannot refer yourself'); END IF;
  IF EXISTS (SELECT 1 FROM referrals WHERE referee_id = me) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'A referral code was already applied');
  END IF;
  INSERT INTO referrals (referrer_id, referee_id, code) VALUES (referrer, me, UPPER(TRIM(p_code)));
  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ─── RPC: unlock an extra task batch (after a rewarded ad) ───
CREATE OR REPLACE FUNCTION public.unlock_task_batch()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me UUID := auth.uid();
  cfg JSONB := public.earn_config();
  today DATE := CURRENT_DATE;
  batches INTEGER;
BEGIN
  IF me IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  INSERT INTO task_daily_stats (user_id, day) VALUES (me, today)
    ON CONFLICT (user_id, day) DO NOTHING;
  SELECT ad_batches INTO batches FROM task_daily_stats WHERE user_id = me AND day = today;
  IF batches >= (cfg->>'max_ad_batches')::int THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Daily ad-batch limit reached');
  END IF;
  UPDATE task_daily_stats SET ad_batches = ad_batches + 1 WHERE user_id = me AND day = today;
  RETURN jsonb_build_object('ok', true, 'ad_batches', batches + 1,
    'extra_tasks', (batches + 1) * (cfg->>'batch_size')::int);
END;
$$;

-- ─── RPC: complete a task (validation + reward, all server-side) ─
CREATE OR REPLACE FUNCTION public.complete_ai_task(
  p_task_id UUID, p_answer JSONB, p_duration_ms INTEGER, p_client_nonce TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me UUID := auth.uid();
  cfg JSONB := public.earn_config();
  t RECORD;
  key JSONB;
  today DATE := CURRENT_DATE;
  stats RECORD;
  last_at TIMESTAMPTZ;
  allowed_today INTEGER;
  is_correct BOOLEAN := true;
  pay INTEGER;
  give_xp INTEGER;
  yesterday_active BOOLEAN;
  new_streak INTEGER;
  bal INTEGER;
BEGIN
  IF me IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Not signed in'); END IF;

  SELECT * INTO t FROM ai_tasks WHERE id = p_task_id AND status = 'published';
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Task unavailable'); END IF;

  -- Level gate
  IF public.get_task_level(me) < t.min_task_level THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Task level too low');
  END IF;

  -- Dedupe non-repeatable tasks
  IF NOT t.repeatable AND EXISTS (
    SELECT 1 FROM ai_task_attempts WHERE user_id = me AND task_id = p_task_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Already completed');
  END IF;

  -- Anti-fraud: minimum solve time (floor + a fraction of the estimate)
  IF COALESCE(p_duration_ms, 0) < GREATEST((cfg->>'min_solve_ms')::int, t.est_seconds * 100) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Submitted too fast');
  END IF;

  -- Anti-fraud: submission rate limit
  SELECT MAX(created_at) INTO last_at FROM ai_task_attempts WHERE user_id = me;
  IF last_at IS NOT NULL AND NOW() - last_at < ((cfg->>'rate_limit_ms')::int || ' milliseconds')::interval THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Too many submissions — slow down');
  END IF;

  -- Daily limits (free + ad-unlocked batches; captchas have their own cap)
  INSERT INTO task_daily_stats (user_id, day) VALUES (me, today)
    ON CONFLICT (user_id, day) DO NOTHING;
  SELECT * INTO stats FROM task_daily_stats WHERE user_id = me AND day = today;
  allowed_today := (cfg->>'free_daily_tasks')::int + stats.ad_batches * (cfg->>'batch_size')::int;
  IF stats.tasks_completed >= allowed_today THEN
    RETURN jsonb_build_object('ok', false, 'error', 'daily_limit', 'allowed', allowed_today);
  END IF;
  IF t.kind = 'captcha' AND stats.captchas_completed >= (cfg->>'captcha_daily_cap')::int THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Captcha daily cap reached');
  END IF;

  -- Validate against the server-side answer key when one exists.
  SELECT answer INTO key FROM ai_task_answers WHERE task_id = p_task_id;
  IF key IS NOT NULL THEN
    is_correct := (key = p_answer) OR (key ? 'accepted' AND key->'accepted' @> p_answer);
  END IF;

  pay := CASE WHEN is_correct THEN t.reward_cents ELSE 0 END;
  give_xp := CASE WHEN is_correct THEN t.xp ELSE 0 END;

  INSERT INTO ai_task_attempts (user_id, task_id, answer, correct, status, reward_cents, xp, duration_ms, client_nonce)
  VALUES (me, p_task_id, p_answer, is_correct,
          CASE WHEN is_correct THEN 'approved' ELSE 'rejected' END,
          pay, give_xp, p_duration_ms, p_client_nonce);

  UPDATE task_daily_stats SET
    tasks_completed = tasks_completed + CASE WHEN is_correct THEN 1 ELSE 0 END,
    captchas_completed = captchas_completed + CASE WHEN is_correct AND t.kind = 'captcha' THEN 1 ELSE 0 END,
    earned_cents = earned_cents + pay,
    xp_earned = xp_earned + give_xp
  WHERE user_id = me AND day = today;

  IF is_correct THEN
    PERFORM public._credit_wallet(me, pay,
      CASE WHEN t.kind IN ('captcha','annotation','survey') THEN t.kind ELSE 'task' END,
      t.title, t.id::text);

    -- XP mirrors the app economy, credited server-side
    IF give_xp > 0 THEN
      UPDATE profiles SET xp = xp + give_xp, updated_at = NOW() WHERE id = me;
      INSERT INTO xp_logs (user_id, amount, source, description)
      VALUES (me, give_xp, 'ai_task', t.title);
    END IF;

    -- Task streak (consecutive days with ≥1 approved task)
    SELECT EXISTS (
      SELECT 1 FROM task_daily_stats
      WHERE user_id = me AND day = today - 1 AND tasks_completed > 0
    ) INTO yesterday_active;
    UPDATE wallets SET
      task_streak_days = CASE
        WHEN task_streak_date = today THEN task_streak_days
        WHEN yesterday_active THEN task_streak_days + 1
        ELSE 1 END,
      task_streak_date = today,
      task_streak_best = GREATEST(task_streak_best, CASE
        WHEN task_streak_date = today THEN task_streak_days
        WHEN yesterday_active THEN task_streak_days + 1
        ELSE 1 END)
    WHERE user_id = me;

    PERFORM public._check_referral_qualification(me);
  END IF;

  SELECT balance_cents INTO bal FROM wallets WHERE user_id = me;
  SELECT * INTO stats FROM task_daily_stats WHERE user_id = me AND day = today;
  RETURN jsonb_build_object(
    'ok', true, 'correct', is_correct, 'reward_cents', pay, 'xp', give_xp,
    'balance_cents', COALESCE(bal, 0),
    'tasks_today', stats.tasks_completed,
    'allowed_today', allowed_today,
    'task_level', public.get_task_level(me)
  );
END;
$$;

-- ─── RPC: everything the dashboard needs in one call ─────────
CREATE OR REPLACE FUNCTION public.get_earn_summary()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me UUID := auth.uid();
  cfg JSONB := public.earn_config();
  w RECORD;
  s RECORD;
  week_cents INTEGER;
  month_cents INTEGER;
  ref_total INTEGER; ref_qualified INTEGER; ref_pending INTEGER;
  approved_tasks INTEGER;
BEGIN
  IF me IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  INSERT INTO wallets (user_id) VALUES (me) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO w FROM wallets WHERE user_id = me;
  SELECT * INTO s FROM task_daily_stats WHERE user_id = me AND day = CURRENT_DATE;

  SELECT COALESCE(SUM(earned_cents),0) INTO week_cents FROM task_daily_stats
    WHERE user_id = me AND day >= CURRENT_DATE - 6;
  SELECT COALESCE(SUM(earned_cents),0) INTO month_cents FROM task_daily_stats
    WHERE user_id = me AND day >= date_trunc('month', CURRENT_DATE)::date;
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'rewarded'), COUNT(*) FILTER (WHERE status = 'pending')
    INTO ref_total, ref_qualified, ref_pending FROM referrals WHERE referrer_id = me;
  SELECT COUNT(*) INTO approved_tasks FROM ai_task_attempts WHERE user_id = me AND status = 'approved';

  RETURN jsonb_build_object(
    'ok', true,
    'wallet', jsonb_build_object(
      'balance_cents', w.balance_cents, 'pending_cents', w.pending_cents,
      'lifetime_cents', w.lifetime_cents, 'task_cents', w.task_cents,
      'survey_cents', w.survey_cents, 'referral_cents', w.referral_cents,
      'bonus_cents', w.bonus_cents),
    'today', jsonb_build_object(
      'tasks_completed', COALESCE(s.tasks_completed, 0),
      'captchas_completed', COALESCE(s.captchas_completed, 0),
      'earned_cents', COALESCE(s.earned_cents, 0),
      'xp_earned', COALESCE(s.xp_earned, 0),
      'ad_batches', COALESCE(s.ad_batches, 0),
      'allowed_today', (cfg->>'free_daily_tasks')::int + COALESCE(s.ad_batches, 0) * (cfg->>'batch_size')::int),
    'week_cents', week_cents,
    'month_cents', month_cents,
    'streak', jsonb_build_object('current', w.task_streak_days, 'best', w.task_streak_best),
    'referrals', jsonb_build_object('total', ref_total, 'qualified', ref_qualified, 'pending', ref_pending),
    'tasks_completed_total', approved_tasks,
    'task_level', public.get_task_level(me),
    'config', cfg
  );
END;
$$;

-- ─── RPC: earnings leaderboard ('week' | 'month' | 'all') ────
CREATE OR REPLACE FUNCTION public.get_top_earners(p_period TEXT DEFAULT 'week')
RETURNS TABLE (user_id UUID, full_name TEXT, avatar_url TEXT, cents BIGINT, tasks BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.user_id, p.full_name, p.avatar_url,
         SUM(s.earned_cents)::bigint AS cents, SUM(s.tasks_completed)::bigint AS tasks
  FROM task_daily_stats s
  JOIN profiles p ON p.id = s.user_id
  WHERE CASE WHEN p_period = 'week' THEN s.day >= CURRENT_DATE - 6
             WHEN p_period = 'month' THEN s.day >= date_trunc('month', CURRENT_DATE)::date
             ELSE true END
  GROUP BY s.user_id, p.full_name, p.avatar_url
  HAVING SUM(s.earned_cents) > 0
  ORDER BY cents DESC
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION public.apply_referral_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_task_batch() TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_ai_task(UUID, JSONB, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_earn_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_earners(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_task_level(UUID) TO authenticated;

-- ─── Starter catalog ─────────────────────────────────────────
-- Repeatable captcha "generator" rows: the app generates the puzzle
-- locally and validates locally; the RPC enforces caps/rate limits.
INSERT INTO ai_tasks (kind, category, title, description, difficulty, reward_cents, xp, est_seconds, content, repeatable, status, order_index) VALUES
('captcha','captcha_text','Text Captcha','Type the characters you see.','easy',1,1,8,'{"generator":"text"}',true,'published',1),
('captcha','captcha_math','Math Captcha','Solve the simple math puzzle.','easy',1,1,8,'{"generator":"math"}',true,'published',2),
('captcha','captcha_selection','Selection Captcha','Pick the matching image.','easy',1,1,10,'{"generator":"selection"}',true,'published',3),
('captcha','captcha_slider','Slider Captcha','Slide to the target position.','easy',1,1,10,'{"generator":"slider"}',true,'published',4)
ON CONFLICT DO NOTHING;

-- Sample micro tasks (answer keys inserted below). Admins manage the
-- real catalog from the web portal (AI Tasks page).
WITH ins AS (
  INSERT INTO ai_tasks (kind, category, title, description, difficulty, reward_cents, xp, est_seconds, content, status, order_index)
  VALUES
  ('microtask','sentiment_analysis','Rate this review''s sentiment','Read the customer review and pick its sentiment.','easy',2,3,20,
   '{"question":"\"The delivery was late and the packaging was damaged, but support fixed it fast.\" — What is the overall sentiment?","options":["Positive","Negative","Mixed","Neutral"]}','published',10),
  ('microtask','text_classification','Classify this message','Which category best fits this text?','easy',2,3,20,
   '{"question":"\"Your parcel #4521 will arrive tomorrow between 9am–12pm.\" — Category?","options":["Delivery update","Marketing","Fraud alert","Personal message"]}','published',11),
  ('microtask','prompt_evaluation','Pick the better AI answer','Compare two AI responses and select the more helpful one.','medium',4,5,35,
   '{"question":"User asked: \"Explain photosynthesis to a 10-year-old.\" Which reply is better?","options":["A: Plants use sunlight like a kitchen uses electricity — they cook air and water into food.","B: Photosynthesis is the biochemical process converting photons into chemical energy via chlorophyll."]}','published',12),
  ('annotation','image_labeling','Identify the animal','Label what appears in the image.','easy',3,4,15,
   '{"question":"Which animal is shown? 🐘","emoji":"🐘","options":["Elephant","Rhino","Hippo","Buffalo"]}','published',20),
  ('annotation','emotion_labeling','Label the emotion','Which emotion does this message express?','medium',4,5,25,
   '{"question":"\"I can''t believe I finally got the job after 8 months of applying!!\" — Emotion?","options":["Joy","Relief","Surprise","Pride"],"accept_any_of":[0,1]}','published',21),
  ('survey','survey','AI usage survey','5 quick questions about how you use AI tools.','easy',10,10,120,
   '{"questions":[{"q":"How often do you use AI tools?","options":["Daily","Weekly","Monthly","Never"]},{"q":"Which do you use most?","options":["ChatGPT","Claude","Gemini","Other"]},{"q":"Main use case?","options":["Work","Learning","Fun","Business"]},{"q":"Would you pay for AI tools?","options":["Yes","No","Maybe"]},{"q":"Has AI helped you earn money?","options":["Yes","Not yet"]}]}','published',30)
  RETURNING id, category
)
INSERT INTO ai_task_answers (task_id, answer)
SELECT id, CASE category
  WHEN 'sentiment_analysis' THEN '{"choice":2}'::jsonb
  WHEN 'text_classification' THEN '{"choice":0}'::jsonb
  WHEN 'prompt_evaluation'   THEN '{"choice":0}'::jsonb
  WHEN 'image_labeling'      THEN '{"choice":0}'::jsonb
  WHEN 'emotion_labeling'    THEN '{"accepted":[{"choice":0},{"choice":1}]}'::jsonb
  ELSE NULL END
FROM ins WHERE category <> 'survey';
