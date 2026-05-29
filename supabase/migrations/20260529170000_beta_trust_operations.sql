-- =====================================================================
-- KINGDOM MARKETPLACE: TRUST & OPERATIONS UPGRADE (RUN EIGHTH)
-- Purpose: Adds moderation, abuse reporting, admin audit, and trust/safety features.
-- Execution Order: 8 (Run after scalability upgrade)
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

CREATE OR REPLACE FUNCTION request_seller_verification(note TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  target_profile_id UUID;
BEGIN
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
