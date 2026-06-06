-- Promote the launch admin account in existing databases and keep profile sync
-- Admin promotion logic refactored to remove hardcoded email references.
-- Roles are now managed via Auth metadata or manual admin overrides.

CREATE OR REPLACE FUNCTION ensure_current_user_profile()
RETURNS UUID AS $$
DECLARE
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

  INSERT INTO users (id, email, full_name, avatar_url, role, moderation_status)
  VALUES (auth.uid(), next_email, next_name, next_avatar, next_role, 'active')
  ON CONFLICT (id) DO UPDATE
  SET email = COALESCE(EXCLUDED.email, users.email),
      full_name = COALESCE(EXCLUDED.full_name, users.full_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
      role = COALESCE(users.role, EXCLUDED.role),
      moderation_status = COALESCE(users.moderation_status, 'active'),
      updated_at = NOW();

  INSERT INTO profiles (user_id, is_seller)
  VALUES (auth.uid(), next_role = 'seller')
  ON CONFLICT (user_id) DO NOTHING;

  IF next_role = 'seller' THEN
    INSERT INTO seller_profiles (user_id, profile_completion_score)
    VALUES (auth.uid(), 15)
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF next_role = 'buyer' THEN
    INSERT INTO buyer_profiles (user_id, profile_completion_score)
    VALUES (auth.uid(), 10)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
