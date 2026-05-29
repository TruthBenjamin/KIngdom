-- =====================================================================
-- KINGDOM MARKETPLACE: REAL MARKETPLACE WORKFLOWS UPGRADE (RUN SIXTH)
-- Purpose: Adds workflow, moderation, and quality scoring logic.
-- Execution Order: 6 (Run after marketplace architecture upgrade)
-- =====================================================================
-- Real marketplace workflow upgrade.
-- Adds checkout requirements, order detail data, seller publishing depth, and verified review enforcement.

DO $$
BEGIN
  CREATE TYPE service_status AS ENUM ('draft', 'pending_review', 'active', 'paused', 'rejected', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS category_specializations TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL;
ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS portfolio_urls TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL;
ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS verification_note TEXT;

ALTER TABLE services ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'rejected'));
ALTER TABLE services ADD COLUMN IF NOT EXISTS moderation_status service_status DEFAULT 'draft' NOT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS portfolio_urls TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS package_summary TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS cancellation_policy TEXT DEFAULT 'Buyer may request cancellation before work begins. Active orders require seller/admin review.' NOT NULL;
ALTER TABLE services ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0 NOT NULL CHECK (quality_score >= 0 AND quality_score <= 100);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_requirements TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS scope_confirmation TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispute_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' NOT NULL
  CHECK (status IN ('pending', 'active', 'delivered', 'revision_requested', 'completed', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_services_moderation_created ON services(moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_service_buyer ON orders(service_id, buyer_id, created_at DESC);

CREATE OR REPLACE FUNCTION calculate_service_quality_score(
  service_title TEXT,
  service_description TEXT,
  service_requirements TEXT,
  service_media_url TEXT,
  service_portfolio_urls TEXT[],
  service_tags TEXT[]
)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 10;
BEGIN
  IF LENGTH(COALESCE(service_title, '')) >= 12 THEN score := score + 15; END IF;
  IF LENGTH(COALESCE(service_description, '')) >= 160 THEN score := score + 25; END IF;
  IF LENGTH(COALESCE(service_requirements, '')) >= 40 THEN score := score + 15; END IF;
  IF COALESCE(service_media_url, '') <> '' THEN score := score + 15; END IF;
  IF COALESCE(array_length(service_portfolio_urls, 1), 0) > 0 THEN score := score + 15; END IF;
  IF COALESCE(array_length(service_tags, 1), 0) >= 3 THEN score := score + 5; END IF;
  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION sync_service_workflow_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.quality_score := calculate_service_quality_score(
    NEW.title,
    NEW.description,
    NEW.requirements,
    NEW.media_url,
    COALESCE(NEW.portfolio_urls, ARRAY[]::TEXT[]),
    COALESCE(NEW.tags, ARRAY[]::TEXT[])
  );

  IF COALESCE(NEW.moderation_status::TEXT, '') = '' THEN
    NEW.moderation_status := CASE WHEN NEW.is_active THEN 'pending_review'::service_status ELSE 'draft'::service_status END;
  END IF;

  IF NEW.moderation_status IN ('draft', 'pending_review') THEN
    NEW.is_active := FALSE;
  END IF;

  IF NEW.moderation_status = 'active' THEN
    NEW.is_active := TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_service_workflow_fields_trigger ON services;
CREATE TRIGGER sync_service_workflow_fields_trigger
  BEFORE INSERT OR UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION sync_service_workflow_fields();

CREATE OR REPLACE FUNCTION create_marketplace_order(
  target_service_id UUID,
  buyer_requirements TEXT DEFAULT NULL,
  scope_confirmation TEXT DEFAULT NULL,
  terms_accepted BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  service_record services%ROWTYPE;
  new_order_id UUID;
  new_conversation_id UUID;
  fee_amount INTEGER;
  earnings_amount INTEGER;
BEGIN
  IF NOT terms_accepted THEN
    RAISE EXCEPTION 'Terms must be accepted before checkout';
  END IF;

  IF LENGTH(COALESCE(TRIM(buyer_requirements), '')) < 20 THEN
    RAISE EXCEPTION 'Buyer requirements must describe the project';
  END IF;

  SELECT * INTO service_record
  FROM services
  WHERE id = target_service_id
    AND is_active = TRUE
    AND COALESCE(moderation_status::TEXT, status::TEXT, 'active') = 'active';

  IF service_record.id IS NULL THEN
    RAISE EXCEPTION 'Service is not available for checkout';
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
    status,
    buyer_requirements,
    scope_confirmation,
    terms_accepted_at,
    cancellation_policy
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
    'pending',
    TRIM(buyer_requirements),
    NULLIF(TRIM(scope_confirmation), ''),
    TIMEZONE('utc'::text, NOW()),
    service_record.cancellation_policy
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
    'Order checkout completed and awaiting beta payment confirmation.',
    'SYSTEM',
    jsonb_build_object('order_id', new_order_id, 'service_id', service_record.id, 'event', 'checkout_completed')
  );

  RETURN new_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION request_order_cancellation(target_order_id UUID, reason TEXT)
RETURNS UUID AS $$
DECLARE
  order_record orders%ROWTYPE;
BEGIN
  SELECT * INTO order_record FROM orders WHERE id = target_order_id FOR UPDATE;

  IF order_record.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF auth.uid() NOT IN (order_record.buyer_id, order_record.seller_id) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF order_record.order_status IN ('COMPLETED', 'CANCELLED', 'DISPUTED') THEN RAISE EXCEPTION 'Order cannot be cancelled from this state'; END IF;

  UPDATE orders
  SET order_status = 'CANCELLED',
      status = 'cancelled',
      cancellation_reason = NULLIF(TRIM(reason), ''),
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = target_order_id;

  PERFORM log_order_event(target_order_id, auth.uid(), 'cancellation_requested', order_record.order_status::TEXT, 'CANCELLED', jsonb_build_object('reason', reason));
  RETURN target_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION open_order_dispute(target_order_id UUID, reason TEXT)
RETURNS UUID AS $$
DECLARE
  order_record orders%ROWTYPE;
BEGIN
  SELECT * INTO order_record FROM orders WHERE id = target_order_id FOR UPDATE;

  IF order_record.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF auth.uid() NOT IN (order_record.buyer_id, order_record.seller_id) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF order_record.order_status IN ('COMPLETED', 'CANCELLED') THEN RAISE EXCEPTION 'Order cannot be disputed from this state'; END IF;

  UPDATE orders
  SET order_status = 'DISPUTED',
      dispute_reason = NULLIF(TRIM(reason), ''),
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = target_order_id;

  PERFORM log_order_event(target_order_id, auth.uid(), 'dispute_opened', order_record.order_status::TEXT, 'DISPUTED', jsonb_build_object('reason', reason));
  RETURN target_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION request_order_revision(target_order_id UUID, revision_message TEXT)
RETURNS UUID AS $$
DECLARE
  order_record orders%ROWTYPE;
  conversation_id UUID;
BEGIN
  SELECT * INTO order_record FROM orders WHERE id = target_order_id FOR UPDATE;

  IF order_record.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF order_record.buyer_id <> auth.uid() THEN RAISE EXCEPTION 'Only the buyer can request a revision'; END IF;
  IF order_record.order_status <> 'DELIVERED' THEN RAISE EXCEPTION 'Only delivered orders can receive revision requests'; END IF;

  UPDATE orders
  SET order_status = 'REVISION_REQUESTED',
      status = 'active',
      revision_count = revision_count + 1,
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = target_order_id;

  SELECT id INTO conversation_id FROM conversations WHERE order_id = target_order_id LIMIT 1;

  IF conversation_id IS NOT NULL THEN
    INSERT INTO messages (conversation_id, sender_id, receiver_id, message, message_type, metadata)
    VALUES (conversation_id, auth.uid(), order_record.seller_id, revision_message, 'SYSTEM', jsonb_build_object('order_id', target_order_id, 'event', 'revision_requested'));
  END IF;

  INSERT INTO notifications (user_id, actor_id, conversation_id, order_id, type, title, body)
  VALUES (order_record.seller_id, auth.uid(), conversation_id, target_order_id, 'REVISION_REQUEST', 'Revision requested', revision_message);

  RETURN target_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION accept_marketplace_delivery(target_order_id UUID)
RETURNS UUID AS $$
DECLARE
  order_record orders%ROWTYPE;
  release_reference TEXT;
BEGIN
  SELECT * INTO order_record FROM orders WHERE id = target_order_id FOR UPDATE;

  IF order_record.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF order_record.buyer_id <> auth.uid() THEN RAISE EXCEPTION 'Only the buyer can accept this delivery'; END IF;
  IF order_record.order_status <> 'DELIVERED' THEN RAISE EXCEPTION 'Only delivered orders can be accepted'; END IF;

  PERFORM ensure_wallet(order_record.seller_id);

  UPDATE wallets
  SET pending_balance = pending_balance - order_record.seller_earnings,
      available_balance = available_balance + order_record.seller_earnings,
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE user_id = order_record.seller_id
  AND pending_balance >= order_record.seller_earnings;

  IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient pending balance for release'; END IF;

  UPDATE orders
  SET order_status = 'COMPLETED',
      status = 'completed',
      accepted_at = TIMEZONE('utc'::text, NOW()),
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = target_order_id;

  release_reference := 'REL-' || REPLACE(target_order_id::TEXT, '-', '') || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT;

  INSERT INTO transactions (user_id, order_id, type, amount, status, reference)
  VALUES (order_record.seller_id, target_order_id, 'RELEASE', order_record.seller_earnings, 'COMPLETED', release_reference);

  RETURN target_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON COLUMN services.moderation_status IS 'Draft/pending/active moderation state controlling service visibility.';
COMMENT ON COLUMN services.quality_score IS 'Computed publishing readiness score from service content and proof fields.';
COMMENT ON COLUMN orders.buyer_requirements IS 'Buyer project requirements captured during checkout before order creation.';
