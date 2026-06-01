-- Repairs the launch admin password login by ensuring Supabase Auth has both
-- the user row and the matching email identity row required for password auth.

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  admin_email CONSTANT TEXT := 'thefreelance35@gmail.com';
  admin_password CONSTANT TEXT := 'KingdomAdmin2026!@@00';
  admin_id UUID;
  identity_id_default TEXT;
  identity_id_type TEXT;
BEGIN
  SELECT id INTO admin_id
  FROM auth.users
  WHERE LOWER(email) = admin_email
  LIMIT 1;

  IF admin_id IS NULL THEN
    admin_id := 'd290f1ee-6c54-4b01-90e6-d701748f0851'::UUID;

    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change,
      email_change_token_new,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      admin_email,
      extensions.crypt(admin_password, extensions.gen_salt('bf')),
      NOW(),
      '',
      '',
      '',
      '',
      '{"provider": "email", "providers": ["email"]}'::JSONB,
      '{"full_name": "Kingdom Admin", "role": "admin"}'::JSONB,
      NOW(),
      NOW()
    );
  ELSE
    UPDATE auth.users
    SET encrypted_password = extensions.crypt(admin_password, extensions.gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
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
  END IF;

  SELECT column_default, udt_name
  INTO identity_id_default, identity_id_type
  FROM information_schema.columns
  WHERE table_schema = 'auth'
    AND table_name = 'identities'
    AND column_name = 'id';

  IF EXISTS (
    SELECT 1
    FROM auth.identities
    WHERE provider = 'email'
      AND provider_id = admin_id::TEXT
  ) THEN
    UPDATE auth.identities
    SET user_id = admin_id,
        identity_data = jsonb_build_object('sub', admin_id::TEXT, 'email', admin_email, 'email_verified', TRUE),
        last_sign_in_at = COALESCE(last_sign_in_at, NOW()),
        updated_at = NOW()
    WHERE provider = 'email'
      AND provider_id = admin_id::TEXT;
  ELSIF identity_id_default IS NOT NULL THEN
    INSERT INTO auth.identities (
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      admin_id::TEXT,
      admin_id,
      jsonb_build_object('sub', admin_id::TEXT, 'email', admin_email, 'email_verified', TRUE),
      'email',
      NOW(),
      NOW(),
      NOW()
    );
  ELSIF identity_id_type = 'uuid' THEN
    INSERT INTO auth.identities (
      id,
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      admin_id,
      admin_id::TEXT,
      admin_id,
      jsonb_build_object('sub', admin_id::TEXT, 'email', admin_email, 'email_verified', TRUE),
      'email',
      NOW(),
      NOW(),
      NOW()
    );
  ELSE
    INSERT INTO auth.identities (
      id,
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      admin_id::TEXT,
      admin_id::TEXT,
      admin_id,
      jsonb_build_object('sub', admin_id::TEXT, 'email', admin_email, 'email_verified', TRUE),
      'email',
      NOW(),
      NOW(),
      NOW()
    );
  END IF;

  INSERT INTO public.users (id, email, full_name, role, moderation_status, risk_score)
  VALUES (admin_id, admin_email, 'Kingdom Admin', 'admin', 'active', 0)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = 'admin',
      moderation_status = 'active',
      updated_at = NOW();

  INSERT INTO public.profiles (user_id, bio, is_seller)
  VALUES (admin_id, 'Platform Administrator.', FALSE)
  ON CONFLICT (user_id) DO UPDATE
  SET bio = EXCLUDED.bio,
      is_seller = FALSE,
      updated_at = NOW();

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
