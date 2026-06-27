-- ============================================================
-- AI Hustle Academy — Fix: "Database error saving new user"
-- Run this in the Supabase SQL Editor.
--
-- Root cause: the handle_new_user() trigger ran without an explicit
-- search_path. It fires as the `supabase_auth_admin` role (whose
-- search_path excludes `public`), so `INSERT INTO profiles` could not
-- resolve the table and the whole signup transaction rolled back.
--
-- Fix: pin search_path, schema-qualify the table, and make the trigger
-- defensive so auth can never be blocked by profile creation.
-- ============================================================

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
    -- Never block auth signup if profile creation hiccups
    RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure the auth admin role can execute the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
