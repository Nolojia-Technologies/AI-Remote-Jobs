-- ============================================================================
-- 024_task_pacing.sql — slower task pacing + real-photo annotation
--
--  • Server-side minimum solve time raised from 10% → 30% of est_seconds
--    (matches the new client "review lock"; blocks blind-tap farming).
--  • Existing micro/annotation tasks get realistic est_seconds (≥30s easy,
--    ≥40s medium, ≥50s hard) — slower pace, more session time, lower $/hour.
--  • Emoji-based image tasks are archived; batch 002 replaces them with
--    real photos (content.image_url).
-- ============================================================================

-- Longer estimates for question tasks (captchas & surveys keep their pace).
UPDATE ai_tasks SET est_seconds = GREATEST(est_seconds,
  CASE difficulty WHEN 'easy' THEN 30 WHEN 'medium' THEN 40 ELSE 50 END),
  updated_at = NOW()
WHERE kind IN ('microtask','annotation') AND status = 'published';

-- Retire emoji "image" tasks — replaced by real photos in batch 002.
UPDATE ai_tasks SET status = 'archived', updated_at = NOW()
WHERE kind = 'annotation'
  AND category IN ('image_labeling','object_detection')
  AND content->>'image_url' IS NULL;

-- Stiffer anti-fraud minimum solve time: 30% of the estimate (was 10%).
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
  bal INTEGER;
BEGIN
  IF me IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Not signed in'); END IF;

  SELECT * INTO t FROM ai_tasks WHERE id = p_task_id AND status = 'published';
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'Task unavailable'); END IF;

  IF public.get_task_level(me) < t.min_task_level THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Task level too low');
  END IF;

  IF NOT t.repeatable AND EXISTS (
    SELECT 1 FROM ai_task_attempts WHERE user_id = me AND task_id = p_task_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Already completed');
  END IF;

  -- Anti-fraud: minimum solve time — floor + 30% of the estimate.
  IF COALESCE(p_duration_ms, 0) < GREATEST((cfg->>'min_solve_ms')::int, t.est_seconds * 300) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Submitted too fast');
  END IF;

  SELECT MAX(created_at) INTO last_at FROM ai_task_attempts WHERE user_id = me;
  IF last_at IS NOT NULL AND NOW() - last_at < ((cfg->>'rate_limit_ms')::int || ' milliseconds')::interval THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Too many submissions — slow down');
  END IF;

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

    IF give_xp > 0 THEN
      UPDATE profiles SET xp = xp + give_xp, updated_at = NOW() WHERE id = me;
      INSERT INTO xp_logs (user_id, amount, source, description)
      VALUES (me, give_xp, 'ai_task', t.title);
    END IF;

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
