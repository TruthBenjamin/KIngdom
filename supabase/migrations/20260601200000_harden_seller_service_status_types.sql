-- Harden seller service saving across legacy text columns and enum-backed columns.
-- The app calls upsert_seller_service after ensure_current_user_profile, so both
-- functions must avoid mixed text/user_role and text/service_status CASE branches.

DO $$
BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'moderator';
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'role'
      AND udt_name <> 'user_role'
  ) THEN
    ALTER TABLE public.users
      ALTER COLUMN role DROP DEFAULT,
      ALTER COLUMN role TYPE user_role USING (
        CASE
          WHEN role::TEXT IN ('buyer', 'seller', 'admin', 'moderator') THEN role::TEXT
          ELSE 'buyer'
        END
      )::user_role,
      ALTER COLUMN role SET DEFAULT 'buyer'::user_role;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'services'
      AND column_name = 'moderation_status'
      AND udt_name <> 'service_status'
  ) THEN
    ALTER TABLE public.services
      ALTER COLUMN moderation_status DROP DEFAULT,
      ALTER COLUMN moderation_status TYPE service_status
        USING (
          CASE
            WHEN moderation_status::TEXT IN ('draft', 'pending_review', 'active', 'paused', 'rejected', 'archived') THEN moderation_status::TEXT
            ELSE 'draft'
          END
        )::service_status,
      ALTER COLUMN moderation_status SET DEFAULT 'draft'::service_status;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION ensure_current_user_profile()
RETURNS UUID AS $$
DECLARE
  metadata JSONB := COALESCE(auth.jwt() -> 'user_metadata', '{}'::JSONB);
  next_email TEXT := COALESCE(auth.jwt() ->> 'email', auth.uid()::TEXT || '@unknown.local');
  next_name TEXT := COALESCE(metadata ->> 'full_name', metadata ->> 'name');
  next_avatar TEXT := COALESCE(metadata ->> 'avatar_url', metadata ->> 'picture');
  metadata_role TEXT := LOWER(COALESCE(metadata ->> 'role', 'buyer'));
  next_role user_role := 'buyer'::user_role;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  IF LOWER(next_email) = 'thefreelance35@gmail.com' THEN
    next_role := 'admin'::user_role;
  ELSIF metadata_role IN ('buyer', 'seller', 'admin', 'moderator') THEN
    next_role := metadata_role::user_role;
  END IF;

  INSERT INTO users (id, email, full_name, avatar_url, role, moderation_status)
  VALUES (auth.uid(), next_email, next_name, next_avatar, next_role, 'active')
  ON CONFLICT (id) DO UPDATE
  SET email = COALESCE(EXCLUDED.email, users.email),
      full_name = COALESCE(EXCLUDED.full_name, users.full_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
      role = (
        CASE
          WHEN LOWER(COALESCE(EXCLUDED.email, users.email)) = 'thefreelance35@gmail.com' THEN 'admin'
          WHEN users.role IS NULL THEN EXCLUDED.role::TEXT
          ELSE users.role::TEXT
        END
      )::user_role,
      moderation_status = CASE
        WHEN LOWER(COALESCE(EXCLUDED.email, users.email)) = 'thefreelance35@gmail.com' THEN 'active'
        ELSE COALESCE(users.moderation_status, 'active')
      END,
      updated_at = NOW();

  INSERT INTO profiles (user_id, is_seller)
  VALUES (auth.uid(), next_role::TEXT = 'seller')
  ON CONFLICT (user_id) DO NOTHING;

  IF next_role::TEXT = 'seller' THEN
    INSERT INTO seller_profiles (user_id, profile_completion_score)
    VALUES (auth.uid(), 15)
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF next_role::TEXT = 'buyer' THEN
    INSERT INTO buyer_profiles (user_id, profile_completion_score)
    VALUES (auth.uid(), 10)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, auth, extensions;

CREATE OR REPLACE FUNCTION upsert_seller_service(
  target_service_id UUID DEFAULT NULL,
  service_title TEXT DEFAULT NULL,
  service_description TEXT DEFAULT NULL,
  service_category TEXT DEFAULT 'General',
  service_category_slug TEXT DEFAULT 'general',
  service_price INTEGER DEFAULT 1,
  service_delivery_days INTEGER DEFAULT 3,
  service_revision_count INTEGER DEFAULT 1,
  service_requirements TEXT DEFAULT NULL,
  service_media_url TEXT DEFAULT NULL,
  service_portfolio_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  service_package_summary TEXT DEFAULT NULL,
  service_cancellation_policy TEXT DEFAULT NULL,
  service_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  submit_for_review BOOLEAN DEFAULT TRUE
)
RETURNS UUID AS $$
DECLARE
  service_id UUID;
  next_slug TEXT;
  next_moderation service_status;
  next_status TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  PERFORM ensure_current_user_profile();

  IF NOT EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
      AND role::TEXT IN ('seller', 'admin')
      AND COALESCE(moderation_status, 'active') <> 'banned'
  ) THEN
    RAISE EXCEPTION 'Seller access required';
  END IF;

  IF LENGTH(COALESCE(TRIM(service_title), '')) < 8 THEN RAISE EXCEPTION 'Service title is too short'; END IF;
  IF LENGTH(COALESCE(TRIM(service_description), '')) < 40 THEN RAISE EXCEPTION 'Service description must explain the offer'; END IF;

  next_moderation := CASE
    WHEN submit_for_review THEN 'pending_review'::service_status
    ELSE 'draft'::service_status
  END;
  next_status := CASE WHEN submit_for_review THEN 'paused' ELSE 'draft' END;
  next_slug := LOWER(REGEXP_REPLACE(TRIM(service_title), '[^a-zA-Z0-9]+', '-', 'g'));
  next_slug := TRIM(BOTH '-' FROM next_slug);
  IF next_slug = '' THEN next_slug := 'service'; END IF;

  IF target_service_id IS NULL THEN
    next_slug := next_slug || '-' || SUBSTRING(REPLACE(uuid_generate_v4()::TEXT, '-', ''), 1, 8);

    INSERT INTO services (
      seller_id,
      title,
      slug,
      description,
      category,
      category_slug,
      price,
      delivery_days,
      revision_count,
      requirements,
      media_url,
      portfolio_urls,
      package_summary,
      cancellation_policy,
      tags,
      moderation_status,
      status,
      is_active
    )
    VALUES (
      auth.uid(),
      TRIM(service_title),
      next_slug,
      TRIM(service_description),
      COALESCE(NULLIF(TRIM(service_category), ''), 'General'),
      COALESCE(NULLIF(TRIM(service_category_slug), ''), 'general'),
      GREATEST(COALESCE(service_price, 1), 1),
      GREATEST(COALESCE(service_delivery_days, 3), 1),
      GREATEST(COALESCE(service_revision_count, 1), 0),
      NULLIF(TRIM(service_requirements), ''),
      NULLIF(TRIM(service_media_url), ''),
      COALESCE(service_portfolio_urls, ARRAY[]::TEXT[]),
      NULLIF(TRIM(service_package_summary), ''),
      COALESCE(NULLIF(TRIM(service_cancellation_policy), ''), 'Buyer may request cancellation before work begins. Active orders require seller/admin review.'),
      COALESCE(service_tags, ARRAY[]::TEXT[]),
      next_moderation,
      next_status,
      FALSE
    )
    RETURNING id INTO service_id;
  ELSE
    UPDATE services
    SET title = TRIM(service_title),
        description = TRIM(service_description),
        category = COALESCE(NULLIF(TRIM(service_category), ''), 'General'),
        category_slug = COALESCE(NULLIF(TRIM(service_category_slug), ''), 'general'),
        price = GREATEST(COALESCE(service_price, 1), 1),
        delivery_days = GREATEST(COALESCE(service_delivery_days, 3), 1),
        revision_count = GREATEST(COALESCE(service_revision_count, 1), 0),
        requirements = NULLIF(TRIM(service_requirements), ''),
        media_url = NULLIF(TRIM(service_media_url), ''),
        portfolio_urls = COALESCE(service_portfolio_urls, ARRAY[]::TEXT[]),
        package_summary = NULLIF(TRIM(service_package_summary), ''),
        cancellation_policy = COALESCE(NULLIF(TRIM(service_cancellation_policy), ''), cancellation_policy),
        tags = COALESCE(service_tags, ARRAY[]::TEXT[]),
        moderation_status = (
          CASE
            WHEN submit_for_review AND moderation_status::TEXT <> 'active' THEN 'pending_review'
            ELSE moderation_status::TEXT
          END
        )::service_status,
        status = CASE
          WHEN submit_for_review AND moderation_status::TEXT <> 'active' THEN 'paused'
          ELSE status
        END,
        is_active = CASE
          WHEN moderation_status::TEXT = 'active' THEN is_active
          ELSE FALSE
        END,
        updated_at = NOW()
    WHERE id = target_service_id
      AND seller_id = auth.uid()
    RETURNING id INTO service_id;

    IF service_id IS NULL THEN RAISE EXCEPTION 'Service not found'; END IF;
  END IF;

  RETURN service_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, auth, extensions;

CREATE OR REPLACE FUNCTION set_seller_service_visibility(
  target_service_id UUID,
  next_is_active BOOLEAN
)
RETURNS UUID AS $$
DECLARE
  service_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  PERFORM ensure_current_user_profile();

  UPDATE services
  SET is_active = next_is_active,
      status = CASE WHEN next_is_active THEN 'active' ELSE 'paused' END,
      moderation_status = CASE
        WHEN next_is_active THEN 'active'::service_status
        ELSE 'paused'::service_status
      END,
      updated_at = NOW()
  WHERE id = target_service_id
    AND seller_id = auth.uid()
    AND moderation_status::TEXT IN ('active', 'paused')
  RETURNING id INTO service_id;

  IF service_id IS NULL THEN
    RAISE EXCEPTION 'Only approved services can be resumed or paused by sellers';
  END IF;

  RETURN service_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, auth, extensions;

GRANT EXECUTE ON FUNCTION ensure_current_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_seller_service(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, TEXT, TEXT, TEXT[], TEXT, TEXT, TEXT[], BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION set_seller_service_visibility(UUID, BOOLEAN) TO authenticated;

NOTIFY pgrst, 'reload schema';
