-- 029: segment-unlock catch-up.
-- When config shrinks (e.g. segments 25→10), users who already completed
-- more tasks than the new allowance were permanently locked: +1 batch never
-- caught up to their completed count, so every submission bounced with
-- daily_limit (no credit, task recycled). Now ONE ad always raises the
-- allowance at least a full segment ABOVE what's already completed today.
CREATE OR REPLACE FUNCTION public.unlock_task_batch()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me UUID := auth.uid();
  cfg JSONB := public.earn_config();
  today DATE := CURRENT_DATE;
  free INTEGER := (cfg->>'free_daily_tasks')::int;
  size INTEGER := (cfg->>'batch_size')::int;
  max_b INTEGER := (cfg->>'max_ad_batches')::int;
  s RECORD;
  new_batches INTEGER;
BEGIN
  IF me IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  INSERT INTO task_daily_stats (user_id, day) VALUES (me, today)
    ON CONFLICT (user_id, day) DO NOTHING;
  SELECT * INTO s FROM task_daily_stats WHERE user_id = me AND day = today;

  -- +1 segment, but never less than what covers the completed count + 1 segment.
  new_batches := GREATEST(
    s.ad_batches + 1,
    CEIL(GREATEST(s.tasks_completed - free, 0)::numeric / size)::int + 1
  );
  IF new_batches > max_b THEN
    IF s.ad_batches >= max_b THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Daily ad-batch limit reached');
    END IF;
    new_batches := max_b;
  END IF;

  UPDATE task_daily_stats SET ad_batches = new_batches WHERE user_id = me AND day = today;
  INSERT INTO rewarded_ad_events (user_id, purpose) VALUES (me, 'segment_unlock');
  RETURN jsonb_build_object('ok', true, 'ad_batches', new_batches,
    'extra_tasks', new_batches * size);
END;
$$;
