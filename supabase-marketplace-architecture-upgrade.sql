-- Kingdom Marketplace production architecture upgrade.
-- Run after the base schema, messaging upgrade, and escrow upgrade.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS seller_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  headline TEXT,
  location TEXT,
  response_time_minutes INTEGER,
  verification_status TEXT DEFAULT 'unverified' NOT NULL CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  profile_completion_score INTEGER DEFAULT 0 NOT NULL CHECK (profile_completion_score >= 0 AND profile_completion_score <= 100),
  is_accepting_orders BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE services ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General' NOT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS category_slug TEXT DEFAULT 'general' NOT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS delivery_days INTEGER DEFAULT 3 NOT NULL CHECK (delivery_days > 0);
ALTER TABLE services ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 1 NOT NULL CHECK (revision_count >= 0);
ALTER TABLE services ADD COLUMN IF NOT EXISTS requirements TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'rejected'));

UPDATE services
SET slug = COALESCE(
      slug,
      LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || LEFT(id::TEXT, 8)
    ),
    category_slug = COALESCE(NULLIF(category_slug, ''), LOWER(REGEXP_REPLACE(category, '[^a-zA-Z0-9]+', '-', 'g'))),
    status = CASE WHEN is_active THEN 'active' ELSE 'paused' END
WHERE slug IS NULL OR category_slug IS NULL OR category_slug = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_services_slug_unique ON services(slug);
CREATE INDEX IF NOT EXISTS idx_services_category_slug_active ON services(category_slug, is_active, status);
CREATE INDEX IF NOT EXISTS idx_services_price ON services(price);
CREATE INDEX IF NOT EXISTS idx_services_featured ON services(is_featured, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_services_tags ON services USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at DESC);

CREATE TABLE IF NOT EXISTS buyer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  organization_name TEXT,
  buyer_type TEXT DEFAULT 'individual' NOT NULL CHECK (buyer_type IN ('individual', 'church', 'ministry', 'business')),
  project_interests TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
  default_project_brief TEXT,
  verification_status TEXT DEFAULT 'unverified' NOT NULL CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  profile_completion_score INTEGER DEFAULT 0 NOT NULL CHECK (profile_completion_score >= 0 AND profile_completion_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS saved_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, service_id)
);

CREATE TABLE IF NOT EXISTS order_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  previous_status TEXT,
  next_status TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_seller_profiles_user_id ON seller_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_buyer_profiles_user_id ON buyer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_services_user_id ON saved_services(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_services_service_id ON saved_services(service_id);
CREATE INDEX IF NOT EXISTS idx_order_events_order_id_created_at ON order_events(order_id, created_at);

ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Seller profiles readable by everyone" ON seller_profiles;
DROP POLICY IF EXISTS "Sellers manage own seller profile" ON seller_profiles;
DROP POLICY IF EXISTS "Buyer profiles readable by owner or admin" ON buyer_profiles;
DROP POLICY IF EXISTS "Buyers manage own buyer profile" ON buyer_profiles;
DROP POLICY IF EXISTS "Saved services readable by owner" ON saved_services;
DROP POLICY IF EXISTS "Users manage own saved services" ON saved_services;
DROP POLICY IF EXISTS "Order events readable by participants" ON order_events;

CREATE POLICY "Seller profiles readable by everyone" ON seller_profiles
  FOR SELECT USING (TRUE);

CREATE POLICY "Sellers manage own seller profile" ON seller_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Buyer profiles readable by owner or admin" ON buyer_profiles
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Buyers manage own buyer profile" ON buyer_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Saved services readable by owner" ON saved_services
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users manage own saved services" ON saved_services
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Order events readable by participants" ON order_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_events.order_id
      AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid() OR is_admin())
    )
  );

DROP POLICY IF EXISTS "Orders updateable by lifecycle functions or admin" ON orders;
CREATE POLICY "Orders updateable by admin only" ON orders
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

CREATE OR REPLACE FUNCTION log_order_event(
  target_order_id UUID,
  target_actor_id UUID,
  target_event_type TEXT,
  target_previous_status TEXT DEFAULT NULL,
  target_next_status TEXT DEFAULT NULL,
  target_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO order_events (
    order_id,
    actor_id,
    event_type,
    previous_status,
    next_status,
    metadata
  )
  VALUES (
    target_order_id,
    target_actor_id,
    target_event_type,
    target_previous_status,
    target_next_status,
    target_metadata
  )
  RETURNING id INTO event_id;

  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_order_event(
      NEW.id,
      auth.uid(),
      'order_created',
      NULL,
      COALESCE(NEW.order_status::TEXT, NEW.status::TEXT),
      jsonb_build_object('payment_status', NEW.payment_status)
    );
  ELSIF COALESCE(OLD.order_status::TEXT, OLD.status::TEXT) <> COALESCE(NEW.order_status::TEXT, NEW.status::TEXT) THEN
    PERFORM log_order_event(
      NEW.id,
      auth.uid(),
      'order_status_changed',
      COALESCE(OLD.order_status::TEXT, OLD.status::TEXT),
      COALESCE(NEW.order_status::TEXT, NEW.status::TEXT),
      jsonb_build_object('payment_status', NEW.payment_status)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_order_status_change_trigger ON orders;
CREATE TRIGGER log_order_status_change_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'buyer')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(public.users.full_name, EXCLUDED.full_name),
      avatar_url = COALESCE(public.users.avatar_url, EXCLUDED.avatar_url),
      updated_at = TIMEZONE('utc'::text, NOW());

  INSERT INTO public.profiles (user_id, is_seller)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'buyer') = 'seller')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.buyer_profiles (user_id, profile_completion_score)
  VALUES (NEW.id, 10)
  ON CONFLICT (user_id) DO NOTHING;

  IF COALESCE(NEW.raw_user_meta_data->>'role', 'buyer') = 'seller' THEN
    INSERT INTO public.seller_profiles (user_id, profile_completion_score)
    VALUES (NEW.id, 15)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

CREATE OR REPLACE FUNCTION normalize_service_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || LEFT(NEW.id::TEXT, 8);
  END IF;

  IF NEW.category_slug IS NULL OR NEW.category_slug = '' THEN
    NEW.category_slug := LOWER(REGEXP_REPLACE(COALESCE(NEW.category, 'General'), '[^a-zA-Z0-9]+', '-', 'g'));
  END IF;

  NEW.updated_at := TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS normalize_service_slug_trigger ON services;
CREATE TRIGGER normalize_service_slug_trigger
  BEFORE INSERT OR UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION normalize_service_slug();

DO $$
DECLARE
  realtime_table TEXT;
BEGIN
  FOREACH realtime_table IN ARRAY ARRAY[
    'saved_services',
    'buyer_profiles',
    'seller_profiles',
    'order_events'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', realtime_table);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END LOOP;
END $$;
