-- Repairs the launch admin password login by ensuring Supabase Auth has both
-- the user row and the matching email identity row required for password auth.

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Repair scripts updated to remove hardcoded admin credentials.
  -- Password resets and admin promotions should be handled via the Supabase dashboard.
  -- Supabase Auth scans these columns into non-null strings during password
  -- login. Manual auth.users inserts with NULL values can surface as the
  -- opaque "Database error querying schema" 500 from /auth/v1/token.
  UPDATE auth.users
  SET confirmation_token = COALESCE(confirmation_token, ''),
      recovery_token = COALESCE(recovery_token, ''),
      email_change = COALESCE(email_change, ''),
      email_change_token_new = COALESCE(email_change_token_new, '')
  WHERE confirmation_token IS NULL
     OR recovery_token IS NULL
     OR email_change IS NULL
     OR email_change_token_new IS NULL;
END $$;
