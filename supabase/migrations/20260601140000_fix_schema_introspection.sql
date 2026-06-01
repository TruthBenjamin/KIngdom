-- Fix Supabase Auth/PostgREST schema failures seen as:
-- "Database error querying schema" during admin password login.
--
-- Root cause: manually repaired auth.users rows can leave GoTrue token columns
-- NULL. Supabase Auth scans several of those columns as strings and returns a
-- generic 500 when it finds NULL. This migration normalizes those rows, keeps
-- hardens public SECURITY DEFINER functions, and reloads the PostgREST schema
-- cache. It intentionally avoids ALTER TABLE on Supabase-managed auth tables
-- because the dashboard SQL role can update those rows but does not own them.

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
      BEGIN
        EXECUTE format('GRANT USAGE ON SCHEMA public TO %I', target_role);
      EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipping public schema grant for role %: insufficient privilege', target_role;
      END;

      BEGIN
        EXECUTE format('GRANT USAGE ON SCHEMA auth TO %I', target_role);
      EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipping auth schema grant for role %: insufficient privilege', target_role;
      END;

      BEGIN
        EXECUTE format('GRANT USAGE ON SCHEMA extensions TO %I', target_role);
      EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipping extensions schema grant for role %: insufficient privilege', target_role;
      END;
    END IF;
  END LOOP;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    BEGIN
      GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
      GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'Skipping anon public object grants: insufficient privilege';
    END;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    BEGIN
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
      GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
      GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'Skipping authenticated public object grants: insufficient privilege';
    END;
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
    BEGIN
      EXECUTE format('ALTER FUNCTION %s SET search_path TO public, auth, extensions', target_function);
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'Skipping search_path hardening for function %: insufficient privilege', target_function;
    END;
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

CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  target_buyer_id UUID,
  target_seller_id UUID,
  target_order_id UUID DEFAULT NULL,
  target_service_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, auth, extensions
AS $$
DECLARE
  conversation_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  PERFORM public.ensure_current_user_profile();

  IF auth.uid() NOT IN (target_buyer_id, target_seller_id) THEN
    RAISE EXCEPTION 'Not allowed to create this conversation';
  END IF;

  IF target_buyer_id = target_seller_id THEN
    RAISE EXCEPTION 'You cannot message yourself';
  END IF;

  IF target_service_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.services
    WHERE id = target_service_id
      AND seller_id = target_seller_id
      AND moderation_status = 'active'
      AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Service is not available for messages';
  END IF;

  SELECT id INTO conversation_id
  FROM public.conversations
  WHERE buyer_id = target_buyer_id
    AND seller_id = target_seller_id
    AND COALESCE(order_id, '00000000-0000-0000-0000-000000000000'::UUID) =
      COALESCE(target_order_id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND COALESCE(service_id, '00000000-0000-0000-0000-000000000000'::UUID) =
      COALESCE(target_service_id, '00000000-0000-0000-0000-000000000000'::UUID)
  ORDER BY updated_at DESC
  LIMIT 1;

  IF conversation_id IS NULL THEN
    INSERT INTO public.conversations (buyer_id, seller_id, order_id, service_id, status)
    VALUES (target_buyer_id, target_seller_id, target_order_id, target_service_id, 'active')
    RETURNING id INTO conversation_id;
  ELSE
    UPDATE public.conversations
    SET updated_at = NOW()
    WHERE id = conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_buyer_dashboard_summary(result_limit INTEGER DEFAULT 4)
RETURNS TABLE (
  saved_services_count INTEGER,
  active_chats_count INTEGER,
  completed_orders_count INTEGER,
  total_spent INTEGER,
  saved_services JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public, auth, extensions
AS $$
WITH limited_saved AS (
  SELECT
    services.id,
    services.title,
    services.slug,
    services.price,
    services.category,
    jsonb_build_object('full_name', sellers.full_name) AS seller
  FROM public.saved_services
  JOIN public.services ON services.id = saved_services.service_id
  LEFT JOIN public.users AS sellers ON sellers.id = services.seller_id
  WHERE saved_services.user_id = auth.uid()
  ORDER BY saved_services.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(result_limit, 4), 1), 12)
)
SELECT
  COALESCE((SELECT COUNT(*)::INTEGER FROM public.saved_services WHERE user_id = auth.uid()), 0),
  COALESCE((SELECT COUNT(*)::INTEGER FROM public.conversations WHERE buyer_id = auth.uid() AND status = 'active'), 0),
  COALESCE((SELECT COUNT(*)::INTEGER FROM public.orders WHERE buyer_id = auth.uid() AND order_status = 'COMPLETED'), 0),
  COALESCE((SELECT SUM(COALESCE(NULLIF(total_amount, 0), amount))::INTEGER FROM public.orders WHERE buyer_id = auth.uid() AND payment_status IN ('PAID', 'REFUNDED')), 0),
  COALESCE((SELECT jsonb_agg(to_jsonb(limited_saved)) FROM limited_saved), '[]'::JSONB)
WHERE auth.uid() IS NOT NULL;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID, UUID, UUID, UUID) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.get_buyer_dashboard_summary(INTEGER) TO authenticated;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
COMMENT ON SCHEMA public IS 'Kingdom Marketplace public API schema';
