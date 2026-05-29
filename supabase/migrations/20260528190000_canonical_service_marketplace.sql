-- =====================================================================
-- KINGDOM MARKETPLACE: LEGACY SERVICE MIGRATION (OPTIONAL)
-- Purpose: Migrates old listing-based databases to the service-first model.
-- Execution Order: LEGACY ONLY. Do not run on a fresh database that used supabase/schema/canonical.sql.
-- Legacy Order: Run 5, after supabase-marketplace-architecture-upgrade.sql.
-- Current Path: Skip this when using the recommended canonical fresh-install path.
-- =====================================================================
-- Kingdom Marketplace canonical service model.
-- Baseline direction: services are the marketplace entity; listings are legacy input only.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Compatibility columns/tables let this legacy migration run without parse
-- errors on partially upgraded databases. Fresh installs should skip this file.
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  price_min INTEGER DEFAULT 1 NOT NULL,
  price_max INTEGER DEFAULT 1 NOT NULL,
  delivery_days INTEGER DEFAULT 3 NOT NULL,
  images TEXT[],
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

DO $$
BEGIN
  CREATE TYPE service_status AS ENUM ('draft', 'pending_review', 'active', 'paused', 'rejected', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE review_status AS ENUM ('published', 'hidden', 'flagged');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE services ADD COLUMN IF NOT EXISTS legacy_listing_id UUID REFERENCES listings(id) ON DELETE SET NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES listings(id) ON DELETE SET NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General' NOT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS category_slug TEXT DEFAULT 'general' NOT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS delivery_days INTEGER DEFAULT 3 NOT NULL CHECK (delivery_days > 0);
ALTER TABLE services ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 1 NOT NULL CHECK (revision_count >= 0);
ALTER TABLE services ADD COLUMN IF NOT EXISTS requirements TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS moderation_status service_status DEFAULT 'draft' NOT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'status'
  ) THEN
    UPDATE services
    SET legacy_listing_id = COALESCE(legacy_listing_id, listing_id),
        slug = COALESCE(
          NULLIF(slug, ''),
          LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || LEFT(id::TEXT, 8)
        ),
        category_slug = COALESCE(NULLIF(category_slug, ''), LOWER(REGEXP_REPLACE(COALESCE(category, 'General'), '[^a-zA-Z0-9]+', '-', 'g'))),
        moderation_status = CASE
          WHEN COALESCE(status::TEXT, 'active') = 'active' AND is_active THEN 'active'::service_status
          WHEN COALESCE(status::TEXT, 'paused') = 'paused' OR NOT is_active THEN 'paused'::service_status
          WHEN COALESCE(status::TEXT, 'draft') = 'draft' THEN 'draft'::service_status
          WHEN COALESCE(status::TEXT, 'rejected') = 'rejected' THEN 'rejected'::service_status
          ELSE moderation_status
        END,
        search_vector =
          setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
          setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
          setweight(to_tsvector('english', COALESCE(category, '')), 'C') ||
          setweight(to_tsvector('english', array_to_string(COALESCE(tags, ARRAY[]::TEXT[]), ' ')), 'C');
  END IF;
END $$;

INSERT INTO services (
  seller_id,
  legacy_listing_id,
  title,
  slug,
  description,
  category,
  category_slug,
  price,
  delivery_days,
  media_url,
  is_active,
  moderation_status,
  search_vector
)
SELECT
  listings.seller_id,
  listings.id,
  listings.title,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(listings.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || LEFT(listings.id::TEXT, 8),
  listings.description,
  listings.category,
  LOWER(REGEXP_REPLACE(COALESCE(listings.category, 'General'), '[^a-zA-Z0-9]+', '-', 'g')),
  GREATEST(listings.price_min, 1),
  GREATEST(listings.delivery_days, 1),
  listings.images[1],
  listings.is_active,
  CASE WHEN listings.is_active THEN 'active'::service_status ELSE 'paused'::service_status END,
  setweight(to_tsvector('english', COALESCE(listings.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(listings.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(listings.category, '')), 'C')
FROM listings
WHERE NOT EXISTS (
  SELECT 1 FROM services WHERE services.legacy_listing_id = listings.id OR services.listing_id = listings.id
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE RESTRICT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES listings(id) ON DELETE SET NULL;

UPDATE orders
SET service_id = services.id
FROM services
WHERE orders.service_id IS NULL
AND orders.listing_id IS NOT NULL
AND (services.legacy_listing_id = orders.listing_id OR services.listing_id = orders.listing_id);

INSERT INTO services (
  seller_id,
  title,
  slug,
  description,
  category,
  category_slug,
  price,
  is_active,
  moderation_status,
  search_vector
)
SELECT
  orders.seller_id,
  COALESCE(NULLIF(orders.title, ''), 'Legacy marketplace service'),
  'legacy-order-' || LEFT(orders.id::TEXT, 8),
  'Legacy service placeholder created while migrating historical orders to the canonical service model.',
  'Legacy',
  'legacy',
  GREATEST(COALESCE(NULLIF(orders.amount, 0), NULLIF(orders.total_amount, 0), 1), 1),
  FALSE,
  'archived'::service_status,
  setweight(to_tsvector('english', COALESCE(orders.title, 'Legacy marketplace service')), 'A')
FROM orders
WHERE orders.service_id IS NULL
AND NOT EXISTS (
  SELECT 1 FROM services WHERE services.slug = 'legacy-order-' || LEFT(orders.id::TEXT, 8)
);

UPDATE orders
SET service_id = services.id
FROM services
WHERE orders.service_id IS NULL
AND services.slug = 'legacy-order-' || LEFT(orders.id::TEXT, 8);

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE SET NULL;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES listings(id) ON DELETE SET NULL;

UPDATE conversations
SET service_id = COALESCE(order_services.service_id, services.id)
FROM services
LEFT JOIN orders AS order_services ON order_services.service_id = services.id
WHERE conversations.service_id IS NULL
AND (
  conversations.listing_id = services.legacy_listing_id
  OR conversations.listing_id = services.listing_id
  OR conversations.order_id = order_services.id
);

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES listings(id) ON DELETE SET NULL;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status review_status DEFAULT 'published' NOT NULL;

UPDATE reviews
SET service_id = services.id
FROM services
WHERE reviews.service_id IS NULL
AND reviews.listing_id IS NOT NULL
AND (services.legacy_listing_id = reviews.listing_id OR services.listing_id = reviews.listing_id);

UPDATE reviews
SET order_id = orders.id
FROM orders
WHERE reviews.order_id IS NULL
AND reviews.service_id = orders.service_id
AND reviews.buyer_id = orders.buyer_id
AND reviews.seller_id = orders.seller_id
AND orders.order_status = 'COMPLETED'
AND NOT EXISTS (
  SELECT 1 FROM reviews existing
  WHERE existing.order_id = orders.id
  AND existing.id <> reviews.id
);

INSERT INTO orders (
  buyer_id,
  seller_id,
  service_id,
  listing_id,
  title,
  amount,
  total_amount,
  escrow_fee_percent,
  escrow_fee_amount,
  seller_earnings,
  payment_status,
  order_status,
  status,
  created_at,
  updated_at
)
SELECT
  reviews.buyer_id,
  reviews.seller_id,
  reviews.service_id,
  reviews.listing_id,
  COALESCE(services.title, listings.title, 'Legacy reviewed service'),
  GREATEST(COALESCE(services.price, listings.price_min, 1), 1),
  GREATEST(COALESCE(services.price, listings.price_min, 1), 1),
  5,
  ROUND(GREATEST(COALESCE(services.price, listings.price_min, 1), 1) * 0.05)::INTEGER,
  GREATEST(COALESCE(services.price, listings.price_min, 1), 1) - ROUND(GREATEST(COALESCE(services.price, listings.price_min, 1), 1) * 0.05)::INTEGER,
  'PAID',
  'COMPLETED',
  'completed',
  reviews.created_at,
  reviews.created_at
FROM reviews
JOIN services ON services.id = reviews.service_id
LEFT JOIN listings ON listings.id = reviews.listing_id
WHERE reviews.order_id IS NULL
AND NOT EXISTS (
  SELECT 1
  FROM orders existing_order
  WHERE existing_order.service_id = reviews.service_id
    AND existing_order.buyer_id = reviews.buyer_id
    AND existing_order.seller_id = reviews.seller_id
    AND existing_order.order_status = 'COMPLETED'
);

UPDATE reviews
SET order_id = orders.id
FROM orders
WHERE reviews.order_id IS NULL
AND reviews.service_id = orders.service_id
AND reviews.buyer_id = orders.buyer_id
AND reviews.seller_id = orders.seller_id
AND orders.order_status = 'COMPLETED'
AND NOT EXISTS (
  SELECT 1 FROM reviews existing
  WHERE existing.order_id = orders.id
  AND existing.id <> reviews.id
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_services_slug_unique ON services(slug);
CREATE INDEX IF NOT EXISTS idx_services_search_vector ON services USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_services_title_trgm ON services USING GIN(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_services_category_status ON services(category_slug, moderation_status, is_active);
CREATE INDEX IF NOT EXISTS idx_services_seller_status ON services(seller_id, moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_service_status ON orders(service_id, order_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_service_id ON conversations(service_id);
CREATE INDEX IF NOT EXISTS idx_reviews_service_status ON reviews(service_id, status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_order_unique ON reviews(order_id) WHERE order_id IS NOT NULL;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_service_required;
ALTER TABLE orders ADD CONSTRAINT orders_service_required CHECK (service_id IS NOT NULL);

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_verified_order_required;
ALTER TABLE reviews ADD CONSTRAINT reviews_verified_order_required CHECK (order_id IS NOT NULL AND service_id IS NOT NULL);

CREATE OR REPLACE FUNCTION sync_service_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || LEFT(NEW.id::TEXT, 8);
  END IF;

  IF NEW.category_slug IS NULL OR NEW.category_slug = '' THEN
    NEW.category_slug := LOWER(REGEXP_REPLACE(COALESCE(NEW.category, 'General'), '[^a-zA-Z0-9]+', '-', 'g'));
  END IF;

  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(COALESCE(NEW.tags, ARRAY[]::TEXT[]), ' ')), 'C');
  NEW.updated_at := TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_service_search_vector_trigger ON services;
CREATE TRIGGER sync_service_search_vector_trigger
  BEFORE INSERT OR UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION sync_service_search_vector();

CREATE OR REPLACE FUNCTION create_marketplace_order(target_service_id UUID)
RETURNS UUID AS $$
DECLARE
  service_record services%ROWTYPE;
  new_order_id UUID;
  new_conversation_id UUID;
  fee_amount INTEGER;
  earnings_amount INTEGER;
BEGIN
  SELECT * INTO service_record
  FROM services
  WHERE id = target_service_id
    AND is_active = TRUE
    AND COALESCE(moderation_status::TEXT, status::TEXT, 'active') = 'active';

  IF service_record.id IS NULL THEN
    RAISE EXCEPTION 'Service not found';
  END IF;

  IF service_record.seller_id = auth.uid() THEN
    RAISE EXCEPTION 'Sellers cannot buy their own service';
  END IF;

  fee_amount := ROUND(service_record.price * 0.05)::INTEGER;
  earnings_amount := service_record.price - fee_amount;

  INSERT INTO orders (
    buyer_id,
    seller_id,
    service_id,
    title,
    amount,
    total_amount,
    escrow_fee_percent,
    escrow_fee_amount,
    seller_earnings,
    payment_status,
    order_status,
    status
  )
  VALUES (
    auth.uid(),
    service_record.seller_id,
    service_record.id,
    service_record.title,
    service_record.price,
    service_record.price,
    5,
    fee_amount,
    earnings_amount,
    'PENDING',
    'PENDING_PAYMENT',
    'pending'
  )
  RETURNING id INTO new_order_id;

  PERFORM ensure_wallet(service_record.seller_id);

  INSERT INTO conversations (buyer_id, seller_id, order_id, service_id, status)
  VALUES (auth.uid(), service_record.seller_id, new_order_id, service_record.id, 'active')
  RETURNING id INTO new_conversation_id;

  INSERT INTO messages (conversation_id, sender_id, receiver_id, message, message_type, metadata)
  VALUES (
    new_conversation_id,
    auth.uid(),
    service_record.seller_id,
    'Order created and awaiting beta payment confirmation.',
    'SYSTEM',
    jsonb_build_object('order_id', new_order_id, 'service_id', service_record.id, 'event', 'order_created')
  );

  RETURN new_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_or_create_conversation(
  target_buyer_id UUID,
  target_seller_id UUID,
  target_order_id UUID DEFAULT NULL,
  target_service_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
BEGIN
  IF auth.uid() NOT IN (target_buyer_id, target_seller_id) THEN
    RAISE EXCEPTION 'Not allowed to create this conversation';
  END IF;

  IF target_service_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM services
    WHERE id = target_service_id
      AND seller_id = target_seller_id
      AND (is_active = TRUE OR auth.uid() = seller_id)
  ) THEN
    RAISE EXCEPTION 'Service not available for this seller';
  END IF;

  SELECT id INTO conversation_id
  FROM conversations
  WHERE buyer_id = target_buyer_id
    AND seller_id = target_seller_id
    AND COALESCE(order_id, '00000000-0000-0000-0000-000000000000'::uuid) =
      COALESCE(target_order_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ORDER BY updated_at DESC
  LIMIT 1;

  IF conversation_id IS NULL THEN
    INSERT INTO conversations (buyer_id, seller_id, order_id, service_id)
    VALUES (target_buyer_id, target_seller_id, target_order_id, target_service_id)
    RETURNING id INTO conversation_id;
  ELSE
    UPDATE conversations
    SET service_id = COALESCE(target_service_id, service_id),
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION submit_completed_order_review(
  target_order_id UUID,
  target_rating INTEGER,
  target_comment TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  order_record orders%ROWTYPE;
  review_id UUID;
BEGIN
  IF target_rating < 1 OR target_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  SELECT * INTO order_record
  FROM orders
  WHERE id = target_order_id
    AND buyer_id = auth.uid()
    AND order_status = 'COMPLETED'
  FOR UPDATE;

  IF order_record.id IS NULL THEN
    RAISE EXCEPTION 'Only completed orders can be reviewed by their buyer';
  END IF;

  INSERT INTO reviews (order_id, service_id, buyer_id, seller_id, rating, comment, status)
  VALUES (
    order_record.id,
    order_record.service_id,
    order_record.buyer_id,
    order_record.seller_id,
    target_rating,
    NULLIF(TRIM(target_comment), ''),
    'published'
  )
  ON CONFLICT (order_id) DO UPDATE
  SET rating = EXCLUDED.rating,
      comment = EXCLUDED.comment,
      status = 'published'
  RETURNING id INTO review_id;

  UPDATE profiles
  SET rating = seller_reviews.rating,
      reviews_count = seller_reviews.reviews_count,
      updated_at = TIMEZONE('utc'::text, NOW())
  FROM (
    SELECT seller_id, ROUND(AVG(rating)::NUMERIC, 2) AS rating, COUNT(*)::INTEGER AS reviews_count
    FROM reviews
    WHERE seller_id = order_record.seller_id
      AND status = 'published'
      AND order_id IS NOT NULL
    GROUP BY seller_id
  ) seller_reviews
  WHERE profiles.user_id = seller_reviews.seller_id;

  RETURN review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION search_services(
  search_query TEXT DEFAULT NULL,
  target_category_slug TEXT DEFAULT NULL,
  min_price INTEGER DEFAULT NULL,
  max_price INTEGER DEFAULT NULL,
  result_limit INTEGER DEFAULT 24,
  result_offset INTEGER DEFAULT 0
)
RETURNS SETOF services AS $$
BEGIN
  RETURN QUERY
  SELECT services.*
  FROM services
  WHERE services.is_active = TRUE
    AND COALESCE(services.moderation_status::TEXT, services.status::TEXT, 'active') = 'active'
    AND (target_category_slug IS NULL OR target_category_slug = 'all' OR services.category_slug = target_category_slug)
    AND (min_price IS NULL OR services.price >= min_price)
    AND (max_price IS NULL OR services.price <= max_price)
    AND (
      search_query IS NULL
      OR search_query = ''
      OR services.search_vector @@ plainto_tsquery('english', search_query)
      OR services.title ILIKE '%' || search_query || '%'
    )
  ORDER BY
    CASE
      WHEN search_query IS NULL OR search_query = '' THEN 0
      ELSE ts_rank_cd(services.search_vector, plainto_tsquery('english', search_query))
    END DESC,
    services.is_featured DESC,
    services.created_at DESC
  LIMIT LEAST(GREATEST(result_limit, 1), 100)
  OFFSET GREATEST(result_offset, 0);
END;
$$ LANGUAGE plpgsql STABLE;

DROP POLICY IF EXISTS "Services readable by everyone" ON services;
CREATE POLICY "Services readable by everyone" ON services
  FOR SELECT USING (
    (is_active = TRUE AND COALESCE(moderation_status::TEXT, status::TEXT, 'active') = 'active')
    OR auth.uid() = seller_id
    OR is_admin()
  );

DROP POLICY IF EXISTS "Buyers can write reviews" ON reviews;
CREATE POLICY "Verified buyers can submit completed order reviews" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = buyer_id
    AND EXISTS (
      SELECT 1
      FROM orders
      WHERE orders.id = reviews.order_id
        AND orders.service_id = reviews.service_id
        AND orders.buyer_id = auth.uid()
        AND orders.seller_id = reviews.seller_id
        AND orders.order_status = 'COMPLETED'
    )
  );

CREATE POLICY "Review authors can update own published review" ON reviews
  FOR UPDATE USING (auth.uid() = buyer_id) WITH CHECK (auth.uid() = buyer_id);

COMMENT ON TABLE listings IS 'Legacy pre-service marketplace table. Do not use for new marketplace workflows.';
COMMENT ON COLUMN services.legacy_listing_id IS 'Migration reference to deprecated listings.id.';
COMMENT ON COLUMN orders.service_id IS 'Canonical marketplace purchase reference. Required for all production orders.';
COMMENT ON COLUMN reviews.order_id IS 'Verified completed order reference. Required for trustworthy reviews.';
