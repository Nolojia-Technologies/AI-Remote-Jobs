-- ============================================================================
-- 018_certification_rpcs.sql  —  Server-side certification logic (RPCs)
-- Idempotent. Run in the Supabase SQL editor. Depends on 016 + 017.
--
-- These SECURITY DEFINER functions are the mobile app's ONLY interface to the
-- certification. They enforce eligibility, serve questions WITHOUT answer keys,
-- score attempts server-side, own the timer via expires_at, and gate retakes.
-- All identity comes from auth.uid() — the client cannot act as another user.
-- ============================================================================

-- ─── Authoritative course completion (reconciles cms_lessons + user_progress) ─
-- Overall % of published lessons (across all published courses) the caller has
-- completed. Replaces jobStore's stale legacy-table calculation.
create or replace function public.get_course_completion()
returns integer
language sql stable security definer set search_path = public as $$
  with total as (
    select count(*)::numeric n
    from public.cms_lessons l
    join public.courses c on c.id = l.course_id
    where c.status = 'published' and l.status = 'published'
  ),
  done as (
    select count(*)::numeric n
    from public.user_progress up
    join public.cms_lessons l on l.id = up.lesson_id
    join public.courses c on c.id = l.course_id
    where up.user_id = auth.uid()
      and up.status = 'completed'
      and c.status = 'published' and l.status = 'published'
  )
  select case when (select n from total) <= 0 then 0
              else least(100, floor((select n from done) / (select n from total) * 100))::int end;
$$;

-- ─── Internal helper: the runner payload (questions WITHOUT correct answers) ──
create or replace function public.cert_active_payload(p_attempt uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_att public.certification_attempts; v_questions jsonb;
begin
  select * into v_att from public.certification_attempts where id = p_attempt;
  if v_att.id is null then raise exception 'attempt not found'; end if;
  if v_att.user_id <> auth.uid() and not public.is_admin() then raise exception 'forbidden'; end if;

  select jsonb_agg(jsonb_build_object(
           'id', aq.question_id,
           'order_index', aq.order_index,
           'type', q.type,
           'prompt', q.prompt,
           'options', aq.served_options,
           'estimated_seconds', q.estimated_seconds,
           'selected_answer', aq.selected_answer
         ) order by aq.order_index)
    into v_questions
    from public.certification_attempt_questions aq
    join public.certification_questions q on q.id = aq.question_id
    where aq.attempt_id = p_attempt;

  return jsonb_build_object(
    'attempt_id', v_att.id,
    'status', v_att.status,
    'started_at', v_att.started_at,
    'expires_at', v_att.expires_at,
    'seconds_remaining', greatest(0, floor(extract(epoch from (v_att.expires_at - now())))::int),
    'total_questions', v_att.total_questions,
    'questions', coalesce(v_questions, '[]'::jsonb)
  );
end $$;

-- ─── Internal helper: the result payload ────────────────────────────────────
create or replace function public.cert_result_payload(p_attempt uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_att public.certification_attempts; v_quiz public.certification_quizzes;
begin
  select * into v_att from public.certification_attempts where id = p_attempt;
  if v_att.id is null then raise exception 'attempt not found'; end if;
  if v_att.user_id <> auth.uid() and not public.is_admin() then raise exception 'forbidden'; end if;
  select * into v_quiz from public.certification_quizzes where id = v_att.quiz_id;
  return jsonb_build_object(
    'attempt_id', v_att.id,
    'status', v_att.status,
    'passed', coalesce(v_att.passed, false),
    'percentage', coalesce(v_att.percentage, 0),
    'passing_score', v_quiz.passing_score,
    'correct_count', coalesce(v_att.correct_count, 0),
    'incorrect_count', coalesce(v_att.incorrect_count, 0),
    'skipped_count', coalesce(v_att.skipped_count, 0),
    'total_questions', v_att.total_questions,
    'seconds_taken', v_att.seconds_taken,
    'expired', v_att.status = 'expired'
  );
end $$;

-- ─── Status: everything the certification hub needs, in one call ─────────────
create or replace function public.cert_status()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_quiz public.certification_quizzes;
  v_gate public.certification_gate;
  v_elig public.job_eligibility;
  v_completion int;
  v_required int;
  v_ready boolean;
  v_bank int;
  v_active public.certification_attempts;
  v_active_json jsonb := null;
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  v_completion := public.get_course_completion();
  select * into v_quiz from public.certification_quizzes where status = 'published' limit 1;
  select * into v_elig from public.job_eligibility where user_id = v_user;
  select * into v_gate from public.certification_gate where user_id = v_user;

  if v_quiz.id is null then
    return jsonb_build_object(
      'available', false,
      'completion_percent', v_completion,
      'is_job_ready', coalesce(v_elig.is_job_ready, false)
    );
  end if;

  select count(*) into v_bank from public.certification_questions
    where quiz_id = v_quiz.id and status = 'published';

  v_required := case when coalesce(v_gate.attempts_used, 0) = 0
                     then v_quiz.unlock_ads_required else v_quiz.retake_ads_required end;
  v_ready := case
    when coalesce(v_gate.attempts_used, 0) = 0 then coalesce(v_gate.ads_watched, 0) >= v_required
    else (v_gate.cooldown_until is not null and now() >= v_gate.cooldown_until)
         or coalesce(v_gate.ads_watched, 0) >= v_required
  end;

  select * into v_active from public.certification_attempts
    where user_id = v_user and status = 'in_progress' limit 1;
  if v_active.id is not null then
    v_active_json := jsonb_build_object(
      'id', v_active.id,
      'expires_at', v_active.expires_at,
      'seconds_remaining', greatest(0, floor(extract(epoch from (v_active.expires_at - now())))::int),
      'total_questions', v_active.total_questions
    );
  end if;

  return jsonb_build_object(
    'available', true,
    'completion_percent', v_completion,
    'completion_required', 80,
    'meets_completion', v_completion >= 80,
    'is_job_ready', coalesce(v_elig.is_job_ready, false),
    'certified_at', v_elig.certified_at,
    'certification_percentage', v_elig.certification_percentage,
    'attempts_used', coalesce(v_gate.attempts_used, 0),
    'cooldown_until', v_gate.cooldown_until,
    'in_cooldown', (v_gate.cooldown_until is not null and now() < v_gate.cooldown_until),
    'ads_watched', coalesce(v_gate.ads_watched, 0),
    'ads_required', v_required,
    'ready_to_start', v_ready,
    'bank_size', v_bank,
    'active_attempt', v_active_json,
    'config', jsonb_build_object(
      'title', v_quiz.title,
      'time_limit_minutes', v_quiz.time_limit_minutes,
      'questions_per_attempt', least(v_quiz.questions_per_attempt, v_bank),
      'passing_score', v_quiz.passing_score,
      'unlock_ads_required', v_quiz.unlock_ads_required,
      'retake_ads_required', v_quiz.retake_ads_required,
      'retake_cooldown_minutes', v_quiz.retake_cooldown_minutes
    )
  );
end $$;

-- ─── Record one completed rewarded ad toward unlock / retake bypass ─────────
create or replace function public.cert_record_ad()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_quiz public.certification_quizzes;
  v_gate public.certification_gate;
  v_required int;
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  select * into v_quiz from public.certification_quizzes where status = 'published' limit 1;
  if v_quiz.id is null then raise exception 'no published certification'; end if;

  insert into public.certification_gate (user_id) values (v_user) on conflict (user_id) do nothing;
  select * into v_gate from public.certification_gate where user_id = v_user for update;

  v_required := case when v_gate.attempts_used = 0
                     then v_quiz.unlock_ads_required else v_quiz.retake_ads_required end;

  update public.certification_gate
    set ads_watched = least(v_required, ads_watched + 1), updated_at = now()
    where user_id = v_user;

  return public.cert_status();
end $$;

-- ─── Start a new attempt (eligibility-checked, random subset, timed) ─────────
create or replace function public.cert_start_attempt()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_quiz public.certification_quizzes;
  v_gate public.certification_gate;
  v_elig public.job_eligibility;
  v_completion int; v_required int; v_ready boolean;
  v_attempt_id uuid; v_idx int := 0; r record; v_opts jsonb;
begin
  if v_user is null then raise exception 'not authenticated'; end if;

  select * into v_quiz from public.certification_quizzes where status = 'published' limit 1;
  if v_quiz.id is null then raise exception 'no published certification'; end if;

  select * into v_elig from public.job_eligibility where user_id = v_user;
  if coalesce(v_elig.is_job_ready, false) then raise exception 'already certified'; end if;

  if exists (select 1 from public.certification_attempts where user_id = v_user and status = 'in_progress') then
    raise exception 'attempt already in progress';
  end if;

  v_completion := public.get_course_completion();
  if v_completion < 80 then raise exception 'course completion below 80 percent'; end if;

  insert into public.certification_gate (user_id) values (v_user) on conflict (user_id) do nothing;
  select * into v_gate from public.certification_gate where user_id = v_user for update;

  v_required := case when v_gate.attempts_used = 0
                     then v_quiz.unlock_ads_required else v_quiz.retake_ads_required end;
  v_ready := case
    when v_gate.attempts_used = 0 then v_gate.ads_watched >= v_required
    else (v_gate.cooldown_until is not null and now() >= v_gate.cooldown_until) or v_gate.ads_watched >= v_required
  end;
  if not v_ready then raise exception 'certification locked'; end if;

  insert into public.certification_attempts (user_id, quiz_id, expires_at, total_questions)
    values (v_user, v_quiz.id, now() + make_interval(mins => v_quiz.time_limit_minutes), 0)
    returning id into v_attempt_id;

  for r in
    select * from public.certification_questions
    where quiz_id = v_quiz.id and status = 'published'
    order by case when v_quiz.randomize_questions then random() else 0 end, created_at
    limit v_quiz.questions_per_attempt
  loop
    v_opts := case when v_quiz.randomize_answers and r.randomize_answers
                   then public.jsonb_shuffle(r.options) else r.options end;
    insert into public.certification_attempt_questions
      (attempt_id, question_id, order_index, served_options, correct_answer, weight)
      values (v_attempt_id, r.id, v_idx, v_opts, r.correct_answer, r.weight);
    v_idx := v_idx + 1;
  end loop;

  if v_idx = 0 then raise exception 'question bank is empty'; end if;
  update public.certification_attempts set total_questions = v_idx where id = v_attempt_id;

  -- Consume readiness; mark this attempt as used (retake rules apply next time).
  update public.certification_gate
    set attempts_used = attempts_used + 1, ads_watched = 0, cooldown_until = null, updated_at = now()
    where user_id = v_user;

  return public.cert_active_payload(v_attempt_id);
end $$;

-- ─── Autosave a single answer (connection-interruption safe) ─────────────────
create or replace function public.cert_save_answer(p_attempt uuid, p_question uuid, p_selected text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_att public.certification_attempts;
begin
  select * into v_att from public.certification_attempts where id = p_attempt;
  if v_att.id is null then raise exception 'attempt not found'; end if;
  if v_att.user_id <> auth.uid() then raise exception 'forbidden'; end if;
  if v_att.status <> 'in_progress' then return false; end if;
  update public.certification_attempt_questions
    set selected_answer = p_selected
    where attempt_id = p_attempt and question_id = p_question;
  return found;
end $$;

-- ─── Submit + score (idempotent; unanswered = incorrect; expiry-aware) ───────
create or replace function public.cert_submit_attempt(p_attempt uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_att public.certification_attempts;
  v_quiz public.certification_quizzes;
  v_total_weight numeric; v_correct_weight numeric;
  v_correct int; v_incorrect int; v_skipped int;
  v_pct int; v_passed boolean; v_secs int; v_expired boolean;
begin
  select * into v_att from public.certification_attempts where id = p_attempt for update;
  if v_att.id is null then raise exception 'attempt not found'; end if;
  if v_att.user_id <> auth.uid() then raise exception 'forbidden'; end if;
  if v_att.status <> 'in_progress' then
    return public.cert_result_payload(p_attempt); -- idempotent
  end if;

  select * into v_quiz from public.certification_quizzes where id = v_att.quiz_id;

  update public.certification_attempt_questions
    set is_correct = (selected_answer is not null and selected_answer = correct_answer)
    where attempt_id = p_attempt;

  select
    coalesce(sum(weight), 0),
    coalesce(sum(weight) filter (where is_correct), 0),
    count(*) filter (where is_correct),
    count(*) filter (where selected_answer is not null and not is_correct),
    count(*) filter (where selected_answer is null)
  into v_total_weight, v_correct_weight, v_correct, v_incorrect, v_skipped
  from public.certification_attempt_questions where attempt_id = p_attempt;

  v_pct := case when v_total_weight <= 0 then 0 else floor(v_correct_weight / v_total_weight * 100)::int end;
  v_passed := v_pct >= v_quiz.passing_score;
  v_secs := greatest(0, floor(extract(epoch from (now() - v_att.started_at)))::int);
  v_expired := now() > v_att.expires_at;

  update public.certification_attempts
    set status = case when v_expired then 'expired' else 'submitted' end,
        submitted_at = now(), score = v_correct_weight, percentage = v_pct, passed = v_passed,
        correct_count = v_correct, incorrect_count = v_incorrect, skipped_count = v_skipped,
        seconds_taken = v_secs, flagged_suspicious = (v_secs < v_quiz.suspicious_seconds)
    where id = p_attempt;

  if v_passed then
    insert into public.job_eligibility
      (user_id, is_job_ready, certified_at, certification_score, certification_percentage, updated_at)
      values (v_att.user_id, true, now(), v_correct_weight, v_pct, now())
      on conflict (user_id) do update
        set is_job_ready = true, certified_at = excluded.certified_at,
            certification_score = excluded.certification_score,
            certification_percentage = excluded.certification_percentage, updated_at = now();
  else
    update public.certification_gate
      set cooldown_until = now() + make_interval(mins => v_quiz.retake_cooldown_minutes),
          ads_watched = 0, updated_at = now()
      where user_id = v_att.user_id;
  end if;

  return public.cert_result_payload(p_attempt);
end $$;

-- ─── Resume an active attempt after app close (auto-submits if expired) ──────
create or replace function public.cert_get_active_attempt()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_att public.certification_attempts;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into v_att from public.certification_attempts
    where user_id = auth.uid() and status = 'in_progress' limit 1;
  if v_att.id is null then return jsonb_build_object('active', false); end if;
  if now() > v_att.expires_at then
    return jsonb_build_object('active', false, 'expired', true, 'result', public.cert_submit_attempt(v_att.id));
  end if;
  return jsonb_build_object('active', true, 'attempt', public.cert_active_payload(v_att.id));
end $$;

-- ─── Post-submit review (answers + explanations + weak/strong topics) ────────
create or replace function public.cert_review(p_attempt uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_att public.certification_attempts; v_questions jsonb; v_weak jsonb; v_strong jsonb;
begin
  select * into v_att from public.certification_attempts where id = p_attempt;
  if v_att.id is null then raise exception 'attempt not found'; end if;
  if v_att.user_id <> auth.uid() and not public.is_admin() then raise exception 'forbidden'; end if;
  if v_att.status = 'in_progress' then raise exception 'attempt not submitted'; end if;

  select jsonb_agg(jsonb_build_object(
      'question_id', aq.question_id, 'type', q.type, 'prompt', q.prompt,
      'options', aq.served_options, 'selected_answer', aq.selected_answer,
      'correct_answer', aq.correct_answer, 'is_correct', aq.is_correct,
      'explanation', q.explanation, 'topic', q.topic, 'course_category', q.course_category
    ) order by aq.order_index)
  into v_questions
  from public.certification_attempt_questions aq
  join public.certification_questions q on q.id = aq.question_id
  where aq.attempt_id = p_attempt;

  select jsonb_agg(topic order by cnt desc) into v_weak from (
    select coalesce(nullif(q.topic, ''), q.course_category) topic, count(*) cnt
    from public.certification_attempt_questions aq join public.certification_questions q on q.id = aq.question_id
    where aq.attempt_id = p_attempt and aq.is_correct = false group by 1 order by cnt desc limit 5
  ) w;
  select jsonb_agg(topic order by cnt desc) into v_strong from (
    select coalesce(nullif(q.topic, ''), q.course_category) topic, count(*) cnt
    from public.certification_attempt_questions aq join public.certification_questions q on q.id = aq.question_id
    where aq.attempt_id = p_attempt and aq.is_correct = true group by 1 order by cnt desc limit 5
  ) s;

  return jsonb_build_object(
    'attempt_id', v_att.id, 'passed', coalesce(v_att.passed, false),
    'percentage', coalesce(v_att.percentage, 0),
    'questions', coalesce(v_questions, '[]'::jsonb),
    'weak_topics', coalesce(v_weak, '[]'::jsonb),
    'strong_topics', coalesce(v_strong, '[]'::jsonb)
  );
end $$;

-- ─── Grants: mobile (authenticated) may call only the public entrypoints ─────
grant execute on function public.get_course_completion() to authenticated;
grant execute on function public.cert_status() to authenticated;
grant execute on function public.cert_record_ad() to authenticated;
grant execute on function public.cert_start_attempt() to authenticated;
grant execute on function public.cert_save_answer(uuid, uuid, text) to authenticated;
grant execute on function public.cert_submit_attempt(uuid) to authenticated;
grant execute on function public.cert_get_active_attempt() to authenticated;
grant execute on function public.cert_review(uuid) to authenticated;
-- cert_active_payload / cert_result_payload are internal helpers (not granted).
