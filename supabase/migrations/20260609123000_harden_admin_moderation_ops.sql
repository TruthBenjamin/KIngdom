-- Align trust-ops RPC permissions with the app's admin/moderator dashboard
-- and make account restoration safer.

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
      AND role::TEXT IN ('admin', 'moderator')
      AND moderation_status <> 'banned'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, auth, extensions;

CREATE OR REPLACE FUNCTION admin_moderate_user(
  target_user_id UUID,
  next_status TEXT,
  reason TEXT DEFAULT NULL,
  next_risk_score INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  target_role TEXT;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF next_status NOT IN ('active', 'warned', 'restricted', 'banned') THEN RAISE EXCEPTION 'Invalid user moderation status'; END IF;
  IF target_user_id = auth.uid() AND next_status = 'banned' THEN RAISE EXCEPTION 'Admins cannot ban their own account'; END IF;

  SELECT role::TEXT INTO target_role
  FROM users
  WHERE id = target_user_id;

  IF target_role IN ('admin', 'moderator') AND next_status = 'banned' THEN
    RAISE EXCEPTION 'Admin and moderator accounts require direct owner review before banning';
  END IF;

  UPDATE users
  SET moderation_status = next_status,
      is_banned = next_status = 'banned',
      ban_reason = CASE WHEN next_status = 'banned' THEN NULLIF(TRIM(reason), '') ELSE NULL END,
      risk_score = COALESCE(next_risk_score, risk_score),
      updated_at = NOW()
  WHERE id = target_user_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;

  PERFORM write_admin_audit('moderate_user', 'user', target_user_id, jsonb_build_object('status', next_status, 'reason', reason));

  INSERT INTO notifications (user_id, type, title, body)
  VALUES (
    target_user_id,
    'MODERATION_ACTION',
    'Account moderation update',
    'Your account status is now ' || next_status || '.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, auth, extensions;

NOTIFY pgrst, 'reload schema';
