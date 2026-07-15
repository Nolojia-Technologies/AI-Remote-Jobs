-- 027: segment size 25 → 15 (first 15 tasks/day free, each rewarded ad
-- unlocks 15 more; 66 ad segments/day ≈ 1,000 tasks — effectively unlimited).
CREATE OR REPLACE FUNCTION public.earn_config()
RETURNS JSONB LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_build_object(
    'free_daily_tasks',     15,
    'batch_size',           15,
    'max_ad_batches',       66,
    'captcha_daily_cap',    150,
    'min_solve_ms',         1500,
    'rate_limit_ms',        1500,
    'referrer_reward_cents', 200,
    'referee_bonus_cents',   50,
    'referral_min_tasks',    5,
    'referral_min_days',     3
  );
$$;
