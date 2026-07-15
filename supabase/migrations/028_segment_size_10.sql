-- 028: segment size 15 → 10 (rewarded ad after every 10 tasks; first 10/day
-- free; 99 ad segments/day = 1,000 tasks). Other ad categories untouched.
CREATE OR REPLACE FUNCTION public.earn_config()
RETURNS JSONB LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_build_object(
    'free_daily_tasks',     10,
    'batch_size',           10,
    'max_ad_batches',       99,
    'captcha_daily_cap',    150,
    'min_solve_ms',         1500,
    'rate_limit_ms',        1500,
    'referrer_reward_cents', 200,
    'referee_bonus_cents',   50,
    'referral_min_tasks',    5,
    'referral_min_days',     3
  );
$$;
