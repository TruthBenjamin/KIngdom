-- =====================================================================
-- KINGDOM MARKETPLACE: TRUST & OPERATIONS UPGRADE
-- Purpose: Adds moderation, abuse reporting, admin audit, and trust/safety features.
-- Execution Order: Current path run 4 of 5, after scalability/search upgrade.
-- Legacy Order: Run 8 only if upgrading an old listing-based database.
-- Run Next: supabase/seed.sql for local/demo data only.
-- =====================================================================
-- Controlled public beta trust and operations systems.

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'SYSTEM_ALERT';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ABUSE_REPORT';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'MODERATION_ACTION';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'SELLER_VERIFICATION';

ALTER TABLE users ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'active' NOT NULL
  CHECK (moderation_status IN ('active', 'warned', 'restricted', 'banned'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0 NOT NULL CHECK (risk_score BETWEEN 0 AND 100);

ALTER TABLE services ADD COLUMN IF NOT EXISTS takedown_reason TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderation_note TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;

ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 100 NOT NULL;

CREATE TABLE IF NOT EXISTS abuse_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'service', 'review', 'message', 'order')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  priority TEXT DEFAULT 'normal' NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  metadata JSONB DEFAULT '{}'::JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS suspicious_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  severity TEXT DEFAULT 'low' NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  metadata JSONB DEFAULT '{}'::JSONB NOT NULL,
  status TEXT DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS manual_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('refund_placeholder', 'credit_placeholder', 'debit_placeholder', 'fee_correction')),
  amount INTEGER DEFAULT 0 NOT NULL CHECK (amount >= 0),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'recorded' NOT NULL CHECK (status IN ('recorded', 'needs_provider_action', 'completed', 'voided')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_abuse_reports_status_priority ON abuse_reports(status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_abuse_reports_target ON abuse_reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON admin_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_user_status ON suspicious_activities(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manual_adjustments_created ON manual_adjustments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_moderation_status ON users(moderation_status, risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_services_moderation_queue ON services(moderation_status, moderated_at DESC NULLS LAST, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_moderation_queue ON reviews(status, created_at DESC);

ALTER TABLE abuse_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspicious_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_adjustments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
      AND role = 'admin'
      AND moderation_status <> 'banned'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION write_admin_audit(
  action_name TEXT,
  target_kind TEXT,
  target_uuid UUID DEFAULT NULL,
  audit_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO admin_audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (auth.uid(), action_name, target_kind, target_uuid, COALESCE(audit_metadata, '{}'::JSONB))
  RETURNING id INTO audit_id;

  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION beta_rate_limit(
  action_name TEXT,
  max_events INTEGER DEFAULT 10,
  window_seconds INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  recent_events INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO recent_events
  FROM suspicious_activities
  WHERE user_id = auth.uid()
    AND activity_type = action_name
    AND created_at > NOW() - MAKE_INTERVAL(secs => window_seconds);

  IF recent_events >= max_events THEN
    INSERT INTO suspicious_activities (user_id, activity_type, severity, metadata)
    VALUES (
      auth.uid(),
      'rate_limit_exceeded',
      'medium',
      jsonb_build_object('action', action_name, 'window_seconds', window_seconds, 'max_events', max_events)
    );
    RETURN FALSE;
  END IF;

  INSERT INTO suspicious_activities (user_id, activity_type, severity, metadata, status)
  VALUES (auth.uid(), action_name, 'low', jsonb_build_object('counted_for_rate_limit', TRUE), 'resolved');
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION ensure_current_user_profile()
RETURNS UUID AS $$
DECLARE
  jwt_claims JSONB := auth.jwt();
  metadata JSONB := COALESCE(auth.jwt() -> 'user_metadata', '{}'::JSONB);
  next_email TEXT := COALESCE(auth.jwt() ->> 'email', auth.uid()::TEXT || '@unknown.local');
  next_name TEXT := COALESCE(metadata ->> 'full_name', metadata ->> 'name');
  next_avatar TEXT := COALESCE(metadata ->> 'avatar_url', metadata ->> 'picture');
  metadata_role TEXT := COALESCE(metadata ->> 'role', 'buyer');
  next_role user_role := 'buyer';
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  IF metadata_role IN ('buyer', 'seller', 'admin') THEN
    next_role := metadata_role::user_role;
  END IF;

  INSERT INTO users (id, email, full_name, avatar_url, role)
  VALUES (auth.uid(), next_email, next_name, next_avatar, next_role)
  ON CONFLICT (id) DO UPDATE
  SET email = COALESCE(EXCLUDED.email, users.email),
      full_name = COALESCE(EXCLUDED.full_name, users.full_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
      updated_at = NOW();

  INSERT INTO profiles (user_id, is_seller)
  VALUES (auth.uid(), next_role = 'seller')
  ON CONFLICT (user_id) DO NOTHING;

  IF next_role = 'seller' THEN
    INSERT INTO seller_profiles (user_id, profile_completion_score)
    VALUES (auth.uid(), 15)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO buyer_profiles (user_id, profile_completion_score)
    VALUES (auth.uid(), 10)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION request_seller_verification(note TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  target_profile_id UUID;
BEGIN
  PERFORM ensure_current_user_profile();

  IF NOT beta_rate_limit('seller_verification_request', 3, 86400) THEN
    RAISE EXCEPTION 'Verification request rate limit exceeded';
  END IF;

  INSERT INTO seller_profiles (user_id, verification_status, verification_note)
  VALUES (auth.uid(), 'pending', NULLIF(TRIM(note), ''))
  ON CONFLICT (user_id) DO UPDATE
  SET verification_status = 'pending',
      verification_note = NULLIF(TRIM(note), ''),
      updated_at = NOW()
  RETURNING id INTO target_profile_id;

  INSERT INTO notifications (user_id, type, title, body)
  VALUES (
    auth.uid(),
    'SELLER_VERIFICATION',
    'Verification request received',
    'Your seller profile is now in the beta verification queue.'
  );

  RETURN target_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION activate_seller_account(
  seller_headline TEXT DEFAULT NULL,
  seller_location TEXT DEFAULT NULL,
  seller_response_time_minutes INTEGER DEFAULT 1440,
  seller_category_specializations TEXT[] DEFAULT ARRAY[]::TEXT[],
  seller_portfolio_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  seller_verification_note TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  target_profile_id UUID;
  completion_score INTEGER := 20;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  PERFORM ensure_current_user_profile();

  IF NOT beta_rate_limit('seller_activation', 5, 86400) THEN
    RAISE EXCEPTION 'Seller activation rate limit exceeded';
  END IF;

  IF COALESCE((SELECT moderation_status FROM users WHERE id = auth.uid()), 'active') = 'banned' THEN
    RAISE EXCEPTION 'Banned accounts cannot activate seller mode';
  END IF;

  IF LENGTH(COALESCE(TRIM(seller_headline), '')) >= 8 THEN completion_score := completion_score + 25; END IF;
  IF LENGTH(COALESCE(TRIM(seller_location), '')) >= 2 THEN completion_score := completion_score + 15; END IF;
  IF COALESCE(seller_response_time_minutes, 0) > 0 THEN completion_score := completion_score + 15; END IF;
  IF COALESCE(array_length(seller_category_specializations, 1), 0) > 0 THEN completion_score := completion_score + 10; END IF;
  IF COALESCE(array_length(seller_portfolio_urls, 1), 0) > 0 THEN completion_score := completion_score + 10; END IF;

  UPDATE users
  SET role = 'seller',
      updated_at = NOW()
  WHERE id = auth.uid();

  INSERT INTO profiles (user_id, is_seller)
  VALUES (auth.uid(), TRUE)
  ON CONFLICT (user_id) DO UPDATE
  SET is_seller = TRUE,
      updated_at = NOW();

  INSERT INTO seller_profiles (
    user_id,
    headline,
    location,
    response_time_minutes,
    category_specializations,
    portfolio_urls,
    verification_note,
    profile_completion_score
  )
  VALUES (
    auth.uid(),
    NULLIF(TRIM(seller_headline), ''),
    NULLIF(TRIM(seller_location), ''),
    GREATEST(COALESCE(seller_response_time_minutes, 1440), 1),
    COALESCE(seller_category_specializations, ARRAY[]::TEXT[]),
    COALESCE(seller_portfolio_urls, ARRAY[]::TEXT[]),
    NULLIF(TRIM(seller_verification_note), ''),
    LEAST(completion_score, 100)
  )
  ON CONFLICT (user_id) DO UPDATE
  SET headline = EXCLUDED.headline,
      location = EXCLUDED.location,
      response_time_minutes = EXCLUDED.response_time_minutes,
      category_specializations = EXCLUDED.category_specializations,
      portfolio_urls = EXCLUDED.portfolio_urls,
      verification_note = EXCLUDED.verification_note,
      profile_completion_score = EXCLUDED.profile_completion_score,
      updated_at = NOW()
  RETURNING id INTO target_profile_id;

  RETURN target_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_account_role(next_role TEXT)
RETURNS TEXT AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  PERFORM ensure_current_user_profile();

  IF next_role NOT IN ('buyer', 'seller') THEN RAISE EXCEPTION 'Invalid account role'; END IF;
  IF COALESCE((SELECT moderation_status FROM users WHERE id = auth.uid()), 'active') = 'banned' THEN
    RAISE EXCEPTION 'Banned accounts cannot change role';
  END IF;

  UPDATE users
  SET role = next_role::user_role,
      updated_at = NOW()
  WHERE id = auth.uid();

  INSERT INTO profiles (user_id, is_seller)
  VALUES (auth.uid(), next_role = 'seller')
  ON CONFLICT (user_id) DO UPDATE
  SET is_seller = next_role = 'seller',
      updated_at = NOW();

  IF next_role = 'seller' THEN
    INSERT INTO seller_profiles (user_id, profile_completion_score)
    VALUES (auth.uid(), 15)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO buyer_profiles (user_id, profile_completion_score)
    VALUES (auth.uid(), 10)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN next_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION upsert_buyer_profile(
  buyer_display_name TEXT DEFAULT NULL,
  buyer_organization_name TEXT DEFAULT NULL,
  buyer_kind TEXT DEFAULT 'individual',
  buyer_project_interests TEXT[] DEFAULT ARRAY[]::TEXT[],
  buyer_default_project_brief TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  target_profile_id UUID;
  completion_score INTEGER := 20;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  PERFORM ensure_current_user_profile();

  IF buyer_kind NOT IN ('individual', 'church', 'ministry', 'business') THEN
    RAISE EXCEPTION 'Invalid buyer type';
  END IF;

  IF COALESCE((SELECT moderation_status FROM users WHERE id = auth.uid()), 'active') = 'banned' THEN
    RAISE EXCEPTION 'Banned accounts cannot update buyer settings';
  END IF;

  IF LENGTH(COALESCE(TRIM(buyer_display_name), '')) >= 2 THEN completion_score := completion_score + 20; END IF;
  IF LENGTH(COALESCE(TRIM(buyer_organization_name), '')) >= 2 THEN completion_score := completion_score + 15; END IF;
  IF COALESCE(array_length(buyer_project_interests, 1), 0) > 0 THEN completion_score := completion_score + 20; END IF;
  IF LENGTH(COALESCE(TRIM(buyer_default_project_brief), '')) >= 20 THEN completion_score := completion_score + 25; END IF;

  UPDATE users
  SET full_name = NULLIF(TRIM(buyer_display_name), ''),
      updated_at = NOW()
  WHERE id = auth.uid();

  INSERT INTO buyer_profiles (
    user_id,
    organization_name,
    buyer_type,
    project_interests,
    default_project_brief,
    profile_completion_score
  )
  VALUES (
    auth.uid(),
    NULLIF(TRIM(buyer_organization_name), ''),
    buyer_kind,
    COALESCE(buyer_project_interests, ARRAY[]::TEXT[]),
    NULLIF(TRIM(buyer_default_project_brief), ''),
    LEAST(completion_score, 100)
  )
  ON CONFLICT (user_id) DO UPDATE
  SET organization_name = EXCLUDED.organization_name,
      buyer_type = EXCLUDED.buyer_type,
      project_interests = EXCLUDED.project_interests,
      default_project_brief = EXCLUDED.default_project_brief,
      profile_completion_score = EXCLUDED.profile_completion_score,
      updated_at = NOW()
  RETURNING id INTO target_profile_id;

  RETURN target_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_saved_service(target_service_id UUID, next_saved BOOLEAN DEFAULT TRUE)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  PERFORM ensure_current_user_profile();

  IF next_saved THEN
    INSERT INTO saved_services (user_id, service_id)
    SELECT auth.uid(), services.id
    FROM services
    WHERE services.id = target_service_id
      AND services.is_active = TRUE
      AND COALESCE(services.moderation_status::TEXT, services.status::TEXT, 'active') = 'active'
    ON CONFLICT (user_id, service_id) DO NOTHING;

    IF NOT FOUND AND NOT EXISTS (SELECT 1 FROM saved_services WHERE user_id = auth.uid() AND service_id = target_service_id) THEN
      RAISE EXCEPTION 'Service is not available to save';
    END IF;
  ELSE
    DELETE FROM saved_services
    WHERE user_id = auth.uid()
      AND service_id = target_service_id;
  END IF;

  RETURN next_saved;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_buyer_dashboard_summary(result_limit INTEGER DEFAULT 4)
RETURNS TABLE (
  saved_services_count INTEGER,
  active_chats_count INTEGER,
  completed_orders_count INTEGER,
  total_spent INTEGER,
  saved_services JSONB
) AS $$
WITH limited_saved AS (
  SELECT
    services.id,
    services.title,
    services.slug,
    services.price,
    services.category,
    jsonb_build_object('full_name', users.full_name) AS seller
  FROM saved_services
  JOIN services ON services.id = saved_services.service_id
  LEFT JOIN users ON users.id = services.seller_id
  WHERE saved_services.user_id = auth.uid()
  ORDER BY saved_services.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(result_limit, 4), 1), 12)
)
SELECT
  (SELECT COUNT(*)::INTEGER FROM saved_services WHERE user_id = auth.uid()) AS saved_services_count,
  (SELECT COUNT(*)::INTEGER FROM conversations WHERE buyer_id = auth.uid() AND status = 'active') AS active_chats_count,
  (SELECT COUNT(*)::INTEGER FROM orders WHERE buyer_id = auth.uid() AND order_status = 'COMPLETED') AS completed_orders_count,
  COALESCE((SELECT SUM(amount)::INTEGER FROM orders WHERE buyer_id = auth.uid() AND order_status IN ('ACTIVE', 'DELIVERED', 'COMPLETED')), 0) AS total_spent,
  COALESCE((SELECT jsonb_agg(to_jsonb(limited_saved)) FROM limited_saved), '[]'::JSONB) AS saved_services
WHERE auth.uid() IS NOT NULL;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION upsert_seller_profile(
  seller_headline TEXT DEFAULT NULL,
  seller_location TEXT DEFAULT NULL,
  seller_response_time_minutes INTEGER DEFAULT 1440,
  seller_is_accepting_orders BOOLEAN DEFAULT TRUE,
  seller_category_specializations TEXT[] DEFAULT ARRAY[]::TEXT[],
  seller_portfolio_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  seller_verification_note TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  target_profile_id UUID;
  completion_score INTEGER := 20;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  PERFORM ensure_current_user_profile();

  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('seller', 'admin') AND moderation_status <> 'banned') THEN
    RAISE EXCEPTION 'Seller access required';
  END IF;

  IF LENGTH(COALESCE(TRIM(seller_headline), '')) >= 8 THEN completion_score := completion_score + 25; END IF;
  IF LENGTH(COALESCE(TRIM(seller_location), '')) >= 2 THEN completion_score := completion_score + 15; END IF;
  IF COALESCE(seller_response_time_minutes, 0) > 0 THEN completion_score := completion_score + 15; END IF;
  IF COALESCE(array_length(seller_category_specializations, 1), 0) > 0 THEN completion_score := completion_score + 10; END IF;
  IF COALESCE(array_length(seller_portfolio_urls, 1), 0) > 0 THEN completion_score := completion_score + 10; END IF;

  INSERT INTO seller_profiles (
    user_id,
    headline,
    location,
    response_time_minutes,
    is_accepting_orders,
    category_specializations,
    portfolio_urls,
    verification_note,
    profile_completion_score
  )
  VALUES (
    auth.uid(),
    NULLIF(TRIM(seller_headline), ''),
    NULLIF(TRIM(seller_location), ''),
    GREATEST(COALESCE(seller_response_time_minutes, 1440), 1),
    COALESCE(seller_is_accepting_orders, TRUE),
    COALESCE(seller_category_specializations, ARRAY[]::TEXT[]),
    COALESCE(seller_portfolio_urls, ARRAY[]::TEXT[]),
    NULLIF(TRIM(seller_verification_note), ''),
    LEAST(completion_score, 100)
  )
  ON CONFLICT (user_id) DO UPDATE
  SET headline = EXCLUDED.headline,
      location = EXCLUDED.location,
      response_time_minutes = EXCLUDED.response_time_minutes,
      is_accepting_orders = EXCLUDED.is_accepting_orders,
      category_specializations = EXCLUDED.category_specializations,
      portfolio_urls = EXCLUDED.portfolio_urls,
      verification_note = EXCLUDED.verification_note,
      profile_completion_score = EXCLUDED.profile_completion_score,
      updated_at = NOW()
  RETURNING id INTO target_profile_id;

  RETURN target_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

  IF NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('seller', 'admin') AND moderation_status <> 'banned') THEN
    RAISE EXCEPTION 'Seller access required';
  END IF;
  IF LENGTH(COALESCE(TRIM(service_title), '')) < 8 THEN RAISE EXCEPTION 'Service title is too short'; END IF;
  IF LENGTH(COALESCE(TRIM(service_description), '')) < 40 THEN RAISE EXCEPTION 'Service description must explain the offer'; END IF;

  next_moderation := CASE WHEN submit_for_review THEN 'pending_review'::service_status ELSE 'draft'::service_status END;
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
        moderation_status = CASE WHEN submit_for_review AND moderation_status <> 'active' THEN 'pending_review'::service_status ELSE moderation_status END,
        status = CASE WHEN submit_for_review AND moderation_status <> 'active' THEN 'paused' ELSE status END,
        is_active = CASE WHEN moderation_status = 'active' THEN is_active ELSE FALSE END,
        updated_at = NOW()
    WHERE id = target_service_id
      AND seller_id = auth.uid()
    RETURNING id INTO service_id;

    IF service_id IS NULL THEN RAISE EXCEPTION 'Service not found'; END IF;
  END IF;

  RETURN service_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
      updated_at = NOW()
  WHERE id = target_service_id
    AND seller_id = auth.uid()
    AND moderation_status IN ('active', 'paused')
  RETURNING id INTO service_id;

  IF service_id IS NULL THEN
    RAISE EXCEPTION 'Only approved services can be resumed or paused by sellers';
  END IF;

  RETURN service_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION submit_abuse_report(
  target_kind TEXT,
  target_uuid UUID,
  report_reason TEXT,
  report_details TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  report_id UUID;
  report_priority TEXT := 'normal';
BEGIN
  IF target_kind NOT IN ('user', 'service', 'review', 'message', 'order') THEN
    RAISE EXCEPTION 'Unsupported report target';
  END IF;

  IF LENGTH(TRIM(report_reason)) < 3 THEN
    RAISE EXCEPTION 'Report reason is required';
  END IF;

  IF NOT beta_rate_limit('abuse_report', 8, 3600) THEN
    RAISE EXCEPTION 'Report rate limit exceeded';
  END IF;

  IF report_reason ILIKE '%fraud%' OR report_reason ILIKE '%threat%' OR report_reason ILIKE '%payment%' THEN
    report_priority := 'high';
  END IF;

  INSERT INTO abuse_reports (reporter_id, target_type, target_id, reason, details, priority)
  VALUES (auth.uid(), target_kind, target_uuid, LEFT(TRIM(report_reason), 160), NULLIF(TRIM(report_details), ''), report_priority)
  RETURNING id INTO report_id;

  RETURN report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_moderate_user(
  target_user_id UUID,
  next_status TEXT,
  reason TEXT DEFAULT NULL,
  next_risk_score INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF next_status NOT IN ('active', 'warned', 'restricted', 'banned') THEN RAISE EXCEPTION 'Invalid user moderation status'; END IF;

  UPDATE users
  SET moderation_status = next_status,
      is_banned = next_status = 'banned',
      ban_reason = CASE WHEN next_status = 'banned' THEN NULLIF(TRIM(reason), '') ELSE ban_reason END,
      risk_score = COALESCE(next_risk_score, risk_score),
      updated_at = NOW()
  WHERE id = target_user_id;

  PERFORM write_admin_audit('moderate_user', 'user', target_user_id, jsonb_build_object('status', next_status, 'reason', reason));

  INSERT INTO notifications (user_id, type, title, body)
  VALUES (
    target_user_id,
    'MODERATION_ACTION',
    'Account moderation update',
    'Your account status is now ' || next_status || '.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_moderate_service(
  target_service_id UUID,
  next_status TEXT,
  reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  owner_id UUID;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF next_status NOT IN ('draft', 'pending_review', 'active', 'paused', 'rejected', 'archived') THEN RAISE EXCEPTION 'Invalid service status'; END IF;

  UPDATE services
  SET moderation_status = next_status::service_status,
      status = CASE WHEN next_status = 'active' THEN 'active' WHEN next_status IN ('paused', 'rejected') THEN next_status ELSE status END,
      is_active = next_status = 'active',
      takedown_reason = CASE WHEN next_status IN ('rejected', 'archived', 'paused') THEN NULLIF(TRIM(reason), '') ELSE NULL END,
      moderated_by = auth.uid(),
      moderated_at = NOW(),
      updated_at = NOW()
  WHERE id = target_service_id
  RETURNING seller_id INTO owner_id;

  PERFORM write_admin_audit('moderate_service', 'service', target_service_id, jsonb_build_object('status', next_status, 'reason', reason));

  IF owner_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, body)
    VALUES (owner_id, 'MODERATION_ACTION', 'Service moderation update', 'A service was marked ' || next_status || '.');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_moderate_review(
  target_review_id UUID,
  next_status TEXT,
  note TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  owner_id UUID;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF next_status NOT IN ('published', 'hidden', 'flagged') THEN RAISE EXCEPTION 'Invalid review status'; END IF;

  UPDATE reviews
  SET status = next_status::review_status,
      moderation_note = NULLIF(TRIM(note), ''),
      moderated_by = auth.uid(),
      moderated_at = NOW()
  WHERE id = target_review_id
  RETURNING buyer_id INTO owner_id;

  PERFORM write_admin_audit('moderate_review', 'review', target_review_id, jsonb_build_object('status', next_status, 'note', note));

  IF owner_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, body)
    VALUES (owner_id, 'MODERATION_ACTION', 'Review moderation update', 'A review you submitted was marked ' || next_status || '.');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_set_seller_verification(
  target_user_id UUID,
  next_status TEXT,
  note TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF next_status NOT IN ('unverified', 'pending', 'verified', 'rejected') THEN RAISE EXCEPTION 'Invalid verification status'; END IF;

  INSERT INTO seller_profiles (user_id, verification_status, verification_note)
  VALUES (target_user_id, next_status, NULLIF(TRIM(note), ''))
  ON CONFLICT (user_id) DO UPDATE
  SET verification_status = next_status,
      verification_note = NULLIF(TRIM(note), ''),
      updated_at = NOW();

  PERFORM write_admin_audit('seller_verification', 'user', target_user_id, jsonb_build_object('status', next_status, 'note', note));

  INSERT INTO notifications (user_id, type, title, body)
  VALUES (target_user_id, 'SELLER_VERIFICATION', 'Seller verification update', 'Your verification status is now ' || next_status || '.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_resolve_report(
  target_report_id UUID,
  next_status TEXT,
  resolution_note TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF next_status NOT IN ('reviewing', 'resolved', 'dismissed') THEN RAISE EXCEPTION 'Invalid report status'; END IF;

  UPDATE abuse_reports
  SET status = next_status,
      assigned_admin_id = auth.uid(),
      resolution = NULLIF(TRIM(resolution_note), ''),
      resolved_at = CASE WHEN next_status IN ('resolved', 'dismissed') THEN NOW() ELSE resolved_at END,
      updated_at = NOW()
  WHERE id = target_report_id;

  PERFORM write_admin_audit('resolve_abuse_report', 'abuse_report', target_report_id, jsonb_build_object('status', next_status, 'resolution', resolution_note));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_record_manual_adjustment(
  target_user_id UUID,
  target_order_id UUID,
  adjustment_kind TEXT,
  adjustment_amount INTEGER,
  adjustment_reason TEXT
)
RETURNS UUID AS $$
DECLARE
  adjustment_id UUID;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF adjustment_kind NOT IN ('refund_placeholder', 'credit_placeholder', 'debit_placeholder', 'fee_correction') THEN
    RAISE EXCEPTION 'Invalid adjustment type';
  END IF;

  INSERT INTO manual_adjustments (user_id, order_id, adjustment_type, amount, reason, created_by)
  VALUES (target_user_id, target_order_id, adjustment_kind, GREATEST(adjustment_amount, 0), LEFT(TRIM(adjustment_reason), 500), auth.uid())
  RETURNING id INTO adjustment_id;

  PERFORM write_admin_audit('manual_adjustment', 'manual_adjustment', adjustment_id, jsonb_build_object('type', adjustment_kind, 'amount', adjustment_amount));
  RETURN adjustment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_upsert_category(
  target_slug TEXT,
  target_name TEXT,
  target_description TEXT DEFAULT NULL,
  target_icon TEXT DEFAULT NULL,
  target_is_active BOOLEAN DEFAULT TRUE
)
RETURNS UUID AS $$
DECLARE
  category_id UUID;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;

  INSERT INTO categories (slug, name, description, icon, is_active)
  VALUES (LOWER(TRIM(target_slug)), TRIM(target_name), NULLIF(TRIM(target_description), ''), NULLIF(TRIM(target_icon), ''), target_is_active)
  ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      icon = EXCLUDED.icon,
      is_active = EXCLUDED.is_active
  RETURNING id INTO category_id;

  PERFORM write_admin_audit('upsert_category', 'category', category_id, jsonb_build_object('slug', target_slug, 'active', target_is_active));
  RETURN category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_notification_read(target_notification_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  changed INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = TRUE
  WHERE user_id = auth.uid()
    AND (target_notification_id IS NULL OR id = target_notification_id)
    AND is_read = FALSE;

  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Abuse reports insertable by authenticated users" ON abuse_reports;
DROP POLICY IF EXISTS "Users readable by marketplace context" ON users;
CREATE POLICY "Users readable by marketplace context" ON users
  FOR SELECT USING (
    auth.uid() = id
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM services
      WHERE services.seller_id = users.id
        AND services.is_active = TRUE
        AND COALESCE(services.moderation_status::TEXT, services.status::TEXT, 'active') = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM conversations
      WHERE (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
        AND (conversations.buyer_id = users.id OR conversations.seller_id = users.id)
    )
    OR EXISTS (
      SELECT 1 FROM orders
      WHERE (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
        AND (orders.buyer_id = users.id OR orders.seller_id = users.id)
    )
  );

DROP POLICY IF EXISTS "Profiles readable by marketplace context" ON profiles;
CREATE POLICY "Profiles readable by marketplace context" ON profiles
  FOR SELECT USING (
    auth.uid() = user_id
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM services
      WHERE services.seller_id = profiles.user_id
        AND services.is_active = TRUE
        AND COALESCE(services.moderation_status::TEXT, services.status::TEXT, 'active') = 'active'
    )
  );

DROP POLICY IF EXISTS "Categories readable by everyone" ON categories;
CREATE POLICY "Categories readable by everyone" ON categories
  FOR SELECT USING (is_active = TRUE OR is_admin());

DROP POLICY IF EXISTS "Seller profiles readable by marketplace context" ON seller_profiles;
CREATE POLICY "Seller profiles readable by marketplace context" ON seller_profiles
  FOR SELECT USING (
    auth.uid() = user_id
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM services
      WHERE services.seller_id = seller_profiles.user_id
        AND services.is_active = TRUE
        AND COALESCE(services.moderation_status::TEXT, services.status::TEXT, 'active') = 'active'
    )
  );

DROP POLICY IF EXISTS "Buyer profiles readable by owner or admin" ON buyer_profiles;
CREATE POLICY "Buyer profiles readable by owner or admin" ON buyer_profiles
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Services readable by marketplace context" ON services;
CREATE POLICY "Services readable by marketplace context" ON services
  FOR SELECT USING (
    (is_active = TRUE AND COALESCE(moderation_status::TEXT, status::TEXT, 'active') = 'active')
    OR auth.uid() = seller_id
    OR is_admin()
  );

DROP POLICY IF EXISTS "Saved services readable by owner" ON saved_services;
CREATE POLICY "Saved services readable by owner" ON saved_services
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Orders readable by participants or admin" ON orders;
CREATE POLICY "Orders readable by participants or admin" ON orders
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR is_admin());

DROP POLICY IF EXISTS "Order events readable by order participants or admin" ON order_events;
CREATE POLICY "Order events readable by order participants or admin" ON order_events
  FOR SELECT USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_events.order_id
        AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Wallets readable by owner or admin" ON wallets;
CREATE POLICY "Wallets readable by owner or admin" ON wallets
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Transactions readable by owner or admin" ON transactions;
CREATE POLICY "Transactions readable by owner or admin" ON transactions
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Withdrawals readable by owner or admin" ON withdrawals;
CREATE POLICY "Withdrawals readable by owner or admin" ON withdrawals
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Deliverables readable by order participants or admin" ON deliverables;
CREATE POLICY "Deliverables readable by order participants or admin" ON deliverables
  FOR SELECT USING (
    auth.uid() = seller_id
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = deliverables.order_id
        AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Conversations readable by participants or admin" ON conversations;
CREATE POLICY "Conversations readable by participants or admin" ON conversations
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR is_admin());

DROP POLICY IF EXISTS "Messages readable by conversation participants or admin" ON messages;
CREATE POLICY "Messages readable by conversation participants or admin" ON messages
  FOR SELECT USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Reviews readable by marketplace context" ON reviews;
CREATE POLICY "Reviews readable by marketplace context" ON reviews
  FOR SELECT USING (
    status = 'published'
    OR auth.uid() = buyer_id
    OR auth.uid() = seller_id
    OR is_admin()
  );

CREATE POLICY "Abuse reports insertable by authenticated users" ON abuse_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Reporters and admins can read abuse reports" ON abuse_reports;
CREATE POLICY "Reporters and admins can read abuse reports" ON abuse_reports
  FOR SELECT USING (auth.uid() = reporter_id OR is_admin());

DROP POLICY IF EXISTS "Admins can update abuse reports" ON abuse_reports;
CREATE POLICY "Admins can update abuse reports" ON abuse_reports
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can read audit logs" ON admin_audit_logs;
CREATE POLICY "Admins can read audit logs" ON admin_audit_logs
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can read suspicious activity" ON suspicious_activities;
CREATE POLICY "Admins can read suspicious activity" ON suspicious_activities
  FOR SELECT USING (is_admin() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update suspicious activity" ON suspicious_activities;
CREATE POLICY "Admins can update suspicious activity" ON suspicious_activities
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can read manual adjustments" ON manual_adjustments;
CREATE POLICY "Admins can read manual adjustments" ON manual_adjustments
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Notifications readable by owner" ON notifications;
CREATE POLICY "Notifications readable by owner" ON notifications
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "Notifications updateable by owner" ON notifications;
CREATE POLICY "Notifications updateable by owner" ON notifications
  FOR UPDATE USING (auth.uid() = user_id OR is_admin()) WITH CHECK (auth.uid() = user_id OR is_admin());

COMMENT ON TABLE abuse_reports IS 'User-submitted trust and safety reports for beta moderation.';
COMMENT ON TABLE admin_audit_logs IS 'Immutable-style admin operation history for moderation and finance actions.';
COMMENT ON TABLE suspicious_activities IS 'Rate-limit and fraud signals for beta abuse review.';
COMMENT ON TABLE manual_adjustments IS 'Admin-recorded refund/credit/debit placeholders until provider-backed finance exists.';
