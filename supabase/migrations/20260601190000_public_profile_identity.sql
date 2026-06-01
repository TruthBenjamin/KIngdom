-- Public seller profile identity and shareable profile URLs.

ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'marketplace' NOT NULL
  CHECK (profile_visibility IN ('private', 'marketplace', 'public'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique
  ON users (LOWER(username))
  WHERE username IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_profile_visibility
  ON users (profile_visibility, role);

CREATE OR REPLACE FUNCTION public.slugify_profile_username(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  base TEXT;
BEGIN
  base := LOWER(REGEXP_REPLACE(COALESCE(TRIM(input), ''), '[^a-zA-Z0-9]+', '-', 'g'));
  base := TRIM(BOTH '-' FROM base);
  base := LEFT(base, 48);

  IF base = '' THEN
    base := 'creator';
  END IF;

  RETURN base;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_unique_profile_username(seed TEXT, target_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base TEXT;
  candidate TEXT;
  suffix INTEGER := 0;
BEGIN
  base := public.slugify_profile_username(seed);
  candidate := base;

  WHILE EXISTS (
    SELECT 1
    FROM users
    WHERE LOWER(username) = LOWER(candidate)
      AND id <> target_user_id
  ) LOOP
    suffix := suffix + 1;
    candidate := LEFT(base, 42) || '-' || suffix::TEXT;
  END LOOP;

  RETURN candidate;
END;
$$;

UPDATE users
SET username = public.generate_unique_profile_username(COALESCE(full_name, email, id::TEXT), id)
WHERE username IS NULL
  AND role IN ('seller', 'admin');

CREATE OR REPLACE FUNCTION public.update_public_profile_identity(
  requested_username TEXT,
  requested_visibility TEXT DEFAULT 'marketplace'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  current_role TEXT;
  next_username TEXT;
  next_visibility TEXT;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT role::TEXT INTO current_role
  FROM users
  WHERE id = current_user_id;

  IF current_role NOT IN ('seller', 'admin') THEN
    RAISE EXCEPTION 'Only sellers can publish a public profile identity';
  END IF;

  next_visibility := COALESCE(NULLIF(TRIM(requested_visibility), ''), 'marketplace');
  IF next_visibility NOT IN ('private', 'marketplace', 'public') THEN
    RAISE EXCEPTION 'Invalid profile visibility';
  END IF;

  next_username := public.generate_unique_profile_username(requested_username, current_user_id);

  UPDATE users
  SET username = next_username,
      profile_visibility = next_visibility,
      updated_at = TIMEZONE('utc', NOW())
  WHERE id = current_user_id;

  RETURN next_username;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_public_profile_identity(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_unique_profile_username(TEXT, UUID) TO authenticated;

DROP POLICY IF EXISTS "Users readable by public profile username" ON users;
CREATE POLICY "Users readable by public profile username" ON users
FOR SELECT USING (
  profile_visibility = 'public'
  OR (
    profile_visibility = 'marketplace'
    AND role IN ('seller', 'admin')
    AND EXISTS (
      SELECT 1
      FROM services
      WHERE services.seller_id = users.id
        AND services.is_active = TRUE
        AND services.moderation_status = 'active'
    )
  )
);
