-- ============================================================================
-- 025_reprice_mills.sql — earnings unit changes from cents to MILLS ($0.001)
--
-- Why: per-task prices must drop well below 1 cent for sustainable unit
-- economics (rewarded eCPM ≈ $12/1000 → ~1.2¢ per rewarded view). Integer
-- cents can't express that, so the *_cents columns now store mills
-- (1 mill = 1/1000 USD). Column names stay for compatibility.
--
-- Existing balances are scaled ×10 (1¢ = 10 mills) so no one loses value.
--
-- New price book (mills):
--   captcha 2 ($0.002) · micro/annotation easy 5, medium 8, hard 15
--   surveys 30–60 ($0.03–0.06) · referrer 200 ($0.20) · referee 50 ($0.05)
-- ============================================================================

-- 1. Preserve value: scale everything previously stored in cents ×10.
UPDATE wallets SET
  balance_cents = balance_cents * 10, pending_cents = pending_cents * 10,
  lifetime_cents = lifetime_cents * 10, task_cents = task_cents * 10,
  survey_cents = survey_cents * 10, referral_cents = referral_cents * 10,
  bonus_cents = bonus_cents * 10;
UPDATE wallet_transactions SET amount_cents = amount_cents * 10;
UPDATE ai_task_attempts SET reward_cents = reward_cents * 10;
UPDATE task_daily_stats SET earned_cents = earned_cents * 10;

-- 2. Widen the per-task cap (5000 mills = $5) and reprice the catalog.
ALTER TABLE ai_tasks DROP CONSTRAINT IF EXISTS ai_tasks_reward_cents_check;
ALTER TABLE ai_tasks ADD CONSTRAINT ai_tasks_reward_cents_check
  CHECK (reward_cents >= 0 AND reward_cents <= 5000);

UPDATE ai_tasks SET reward_cents = CASE
    WHEN kind = 'captcha' THEN 2
    WHEN kind = 'survey' THEN GREATEST(30, LEAST(reward_cents * 4, 80))
    WHEN difficulty = 'easy' THEN 5
    WHEN difficulty = 'medium' THEN 8
    ELSE 15
  END,
  updated_at = NOW()
WHERE status <> 'archived';

COMMENT ON COLUMN ai_tasks.reward_cents IS 'Reward in MILLS (1/1000 USD), not cents — renamed conceptually in migration 025.';
COMMENT ON COLUMN wallets.balance_cents IS 'Balance in MILLS (1/1000 USD) since migration 025.';

-- 3. Referral economics in mills (referrer $0.20, referee $0.05).
CREATE OR REPLACE FUNCTION public.earn_config()
RETURNS JSONB LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_build_object(
    'free_daily_tasks',     100,
    'batch_size',           25,
    'max_ad_batches',       6,
    'captcha_daily_cap',    150,
    'min_solve_ms',         1500,
    'rate_limit_ms',        2000,
    'referrer_reward_cents', 200,  -- mills = $0.20
    'referee_bonus_cents',   50,   -- mills = $0.05
    'referral_min_tasks',    5,
    'referral_min_days',     3
  );
$$;
