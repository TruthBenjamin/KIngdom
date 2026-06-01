-- Fix Supabase Auth/PostgREST schema failures seen as:
-- "Database error querying schema" during admin password login.
--
-- Root cause: manually repaired auth.users rows can leave GoTrue token columns
-- NULL. Supabase Auth scans several of those columns as strings and returns a
-- generic 500 when it finds NULL. This migration normalizes those rows, keeps
-- future manual inserts safer, hardens public SECURITY DEFINER functions, and
-- reloads the PostgREST schema cache.

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  auth_column TEXT;
BEGIN
  -- These auth.users text columns must be empty strings, not NULL, for
  -- password login compatibility across Supabase Auth versions.
  FOREACH auth_column IN ARRAY ARRAY[
    'confirmation_token',
    'recovery_token',
    'email_change',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change',
    'phone_change_token',
    'reauthentication_token'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns AS columns
      WHERE columns.table_schema = 'auth'
        AND columns.table_name = 'users'
        AND columns.column_name = auth_column
    ) THEN
      EXECUTE format('UPDATE auth.users SET %I = '''' WHERE %I IS NULL', auth_column, auth_column);
      EXECUTE format('ALTER TABLE auth.users ALTER COLUMN %I SET DEFAULT ''''', auth_column);
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE
  target_role TEXT;
BEGIN
  -- PostgREST and Supabase Auth need direct schema visibility. Guard every
  -- grant so local/dev databases with a smaller role set can still migrate.
  FOREACH target_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role', 'authenticator', 'postgres']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = target_role) THEN
      EXECUTE format('GRANT USAGE ON SCHEMA public TO %I', target_role);
      EXECUTE format('GRANT USAGE ON SCHEMA auth TO %I', target_role);
      EXECUTE format('GRANT USAGE ON SCHEMA extensions TO %I', target_role);
    END IF;
  END LOOP;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
  END IF;
END $$;

DO $$
DECLARE
  target_function REGPROCEDURE;
BEGIN
  -- Security definer functions that call auth.uid()/auth.jwt() should not
  -- depend on whichever role search_path happens to be active.
  FOR target_function IN
    SELECT pg_proc.oid::REGPROCEDURE
    FROM pg_proc
    JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
    WHERE pg_namespace.nspname = 'public'
      AND pg_proc.prosecdef
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path TO public, auth, extensions', target_function);
  END LOOP;
END $$;

DO $$
DECLARE
  admin_email CONSTANT TEXT := 'thefreelance35@gmail.com';
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id
  FROM auth.users
  WHERE LOWER(email) = admin_email
  LIMIT 1;

  IF admin_id IS NOT NULL THEN
    UPDATE auth.users
    SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change = COALESCE(email_change, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::JSONB)
          || '{"provider": "email", "providers": ["email"]}'::JSONB,
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::JSONB)
          || '{"full_name": "Kingdom Admin", "role": "admin"}'::JSONB,
        updated_at = NOW()
    WHERE id = admin_id;

    INSERT INTO public.users (id, email, full_name, role, moderation_status, risk_score)
    VALUES (admin_id, admin_email, 'Kingdom Admin', 'admin', 'active', 0)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'admin',
        moderation_status = 'active',
        risk_score = 0,
        updated_at = NOW();
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
COMMENT ON SCHEMA public IS 'Kingdom Marketplace public API schema';
