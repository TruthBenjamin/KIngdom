-- Kingdom Marketplace simulated escrow + wallet upgrade.
-- No external payment provider is used here. Payment confirmation is an internal,
-- auditable state transition that can later be triggered by Paystack/Stripe/etc.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE marketplace_order_status AS ENUM (
    'PENDING_PAYMENT',
    'ACTIVE',
    'DELIVERED',
    'REVISION_REQUESTED',
    'COMPLETED',
    'CANCELLED',
    'DISPUTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE transaction_type AS ENUM (
    'PAYMENT',
    'ESCROW_HOLD',
    'RELEASE',
    'WITHDRAWAL',
    'REFUND',
    'FEE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE transaction_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE withdrawal_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  available_balance INTEGER DEFAULT 0 NOT NULL CHECK (available_balance >= 0),
  pending_balance INTEGER DEFAULT 0 NOT NULL CHECK (pending_balance >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_revenue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  source TEXT DEFAULT 'ESCROW_FEE' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 0 NOT NULL CHECK (amount >= 0);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS escrow_fee_percent NUMERIC(5, 2) DEFAULT 5 NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS escrow_fee_amount INTEGER DEFAULT 0 NOT NULL CHECK (escrow_fee_amount >= 0);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_earnings INTEGER DEFAULT 0 NOT NULL CHECK (seller_earnings >= 0);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status payment_status DEFAULT 'PENDING' NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_status marketplace_order_status DEFAULT 'PENDING_PAYMENT' NOT NULL;

UPDATE orders
SET amount = CASE WHEN amount = 0 THEN total_amount ELSE amount END,
    escrow_fee_amount = CASE WHEN escrow_fee_amount = 0 THEN ROUND((CASE WHEN amount = 0 THEN total_amount ELSE amount END) * 0.05)::INTEGER ELSE escrow_fee_amount END,
    seller_earnings = CASE
      WHEN seller_earnings = 0 THEN (CASE WHEN amount = 0 THEN total_amount ELSE amount END) - ROUND((CASE WHEN amount = 0 THEN total_amount ELSE amount END) * 0.05)::INTEGER
      ELSE seller_earnings
    END;

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  type transaction_type NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  status transaction_status DEFAULT 'COMPLETED' NOT NULL,
  reference TEXT UNIQUE NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  status withdrawal_status DEFAULT 'PENDING' NOT NULL,
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS deliverables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_services_seller_id ON services(seller_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_service_id ON orders(service_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_status ON withdrawals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_deliverables_order_id ON deliverables(order_id);
CREATE INDEX IF NOT EXISTS idx_platform_revenue_order_id ON platform_revenue(order_id);

DO $$
DECLARE
  realtime_table TEXT;
BEGIN
  FOREACH realtime_table IN ARRAY ARRAY[
    'wallets',
    'orders',
    'transactions',
    'withdrawals',
    'deliverables',
    'platform_revenue'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', realtime_table);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END LOOP;
END $$;

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Wallets readable by owner or admin" ON wallets;
DROP POLICY IF EXISTS "Services readable by everyone" ON services;
DROP POLICY IF EXISTS "Sellers manage own services" ON services;
DROP POLICY IF EXISTS "Transactions readable by owner or admin" ON transactions;
DROP POLICY IF EXISTS "Withdrawals readable by owner or admin" ON withdrawals;
DROP POLICY IF EXISTS "Users can request withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Admins update withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Deliverables readable by order participants" ON deliverables;
DROP POLICY IF EXISTS "Platform revenue readable by admin" ON platform_revenue;

CREATE POLICY "Wallets readable by owner or admin" ON wallets
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Services readable by everyone" ON services
  FOR SELECT USING (is_active = TRUE OR auth.uid() = seller_id OR is_admin());

CREATE POLICY "Sellers manage own services" ON services
  FOR ALL USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Transactions readable by owner or admin" ON transactions
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Withdrawals readable by owner or admin" ON withdrawals
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can request withdrawals" ON withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update withdrawals" ON withdrawals
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Deliverables readable by order participants" ON deliverables
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = deliverables.order_id
      AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Platform revenue readable by admin" ON platform_revenue
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Orders readable by participants" ON orders;
DROP POLICY IF EXISTS "Orders insertable by buyer" ON orders;
DROP POLICY IF EXISTS "Orders updateable by seller or buyer" ON orders;
DROP POLICY IF EXISTS "Orders updateable by lifecycle functions or admin" ON orders;

CREATE POLICY "Orders readable by participants" ON orders
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR is_admin());

CREATE POLICY "Orders insertable by buyer" ON orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Orders updateable by lifecycle functions or admin" ON orders
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR is_admin())
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id OR is_admin());

CREATE OR REPLACE FUNCTION ensure_wallet(target_user_id UUID)
RETURNS UUID AS $$
DECLARE
  wallet_id UUID;
BEGIN
  INSERT INTO wallets (user_id)
  VALUES (target_user_id)
  ON CONFLICT (user_id) DO UPDATE SET updated_at = wallets.updated_at
  RETURNING id INTO wallet_id;

  RETURN wallet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_marketplace_order(target_service_id UUID)
RETURNS UUID AS $$
DECLARE
  service_record services%ROWTYPE;
  new_order_id UUID;
  new_conversation_id UUID;
  fee_amount INTEGER;
  earnings_amount INTEGER;
BEGIN
  SELECT * INTO service_record FROM services
  WHERE id = target_service_id AND is_active = TRUE;

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
    listing_id,
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
    service_record.listing_id,
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

  INSERT INTO conversations (buyer_id, seller_id, order_id, listing_id, status)
  VALUES (auth.uid(), service_record.seller_id, new_order_id, service_record.listing_id, 'active')
  ON CONFLICT (buyer_id, seller_id, COALESCE(order_id, '00000000-0000-0000-0000-000000000000'::uuid))
  DO UPDATE SET updated_at = TIMEZONE('utc'::text, NOW())
  RETURNING id INTO new_conversation_id;

  INSERT INTO messages (conversation_id, sender_id, receiver_id, message, message_type, metadata)
  VALUES (
    new_conversation_id,
    auth.uid(),
    service_record.seller_id,
    'Order created and awaiting simulated payment.',
    'SYSTEM',
    jsonb_build_object('order_id', new_order_id, 'event', 'order_created')
  );

  RETURN new_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION confirm_simulated_payment(target_order_id UUID)
RETURNS UUID AS $$
DECLARE
  order_record orders%ROWTYPE;
  payment_reference TEXT;
BEGIN
  SELECT * INTO order_record FROM orders
  WHERE id = target_order_id
  FOR UPDATE;

  IF order_record.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF order_record.buyer_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the buyer can confirm payment';
  END IF;

  IF order_record.payment_status <> 'PENDING' OR order_record.order_status <> 'PENDING_PAYMENT' THEN
    RAISE EXCEPTION 'Order is not awaiting payment';
  END IF;

  PERFORM ensure_wallet(order_record.seller_id);
  payment_reference := 'SIM-' || REPLACE(target_order_id::TEXT, '-', '') || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT;

  UPDATE orders
  SET payment_status = 'PAID',
      order_status = 'ACTIVE',
      status = 'active',
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = target_order_id;

  UPDATE wallets
  SET pending_balance = pending_balance + order_record.seller_earnings,
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE user_id = order_record.seller_id;

  INSERT INTO transactions (user_id, order_id, type, amount, status, reference)
  VALUES
    (order_record.buyer_id, target_order_id, 'PAYMENT', order_record.amount, 'COMPLETED', payment_reference || '-PAYMENT'),
    (order_record.seller_id, target_order_id, 'ESCROW_HOLD', order_record.seller_earnings, 'COMPLETED', payment_reference || '-HOLD'),
    (NULL, target_order_id, 'FEE', order_record.escrow_fee_amount, 'COMPLETED', payment_reference || '-FEE');

  INSERT INTO platform_revenue (order_id, amount)
  VALUES (target_order_id, order_record.escrow_fee_amount);

  INSERT INTO notifications (user_id, actor_id, order_id, type, title, body)
  VALUES (
    order_record.seller_id,
    order_record.buyer_id,
    target_order_id,
    'PAYMENT_CONFIRMATION',
    'Payment confirmed',
    'Funds are now held in escrow for this order.'
  );

  RETURN target_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION deliver_marketplace_order(
  target_order_id UUID,
  delivery_message TEXT,
  delivery_file_url TEXT DEFAULT NULL,
  delivery_file_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  order_record orders%ROWTYPE;
  conversation_id UUID;
  deliverable_id UUID;
BEGIN
  SELECT * INTO order_record FROM orders
  WHERE id = target_order_id
  FOR UPDATE;

  IF order_record.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF order_record.seller_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the seller can deliver this order';
  END IF;

  IF order_record.order_status NOT IN ('ACTIVE', 'REVISION_REQUESTED') THEN
    RAISE EXCEPTION 'Order cannot be delivered from its current status';
  END IF;

  INSERT INTO deliverables (order_id, seller_id, message, file_url, file_name)
  VALUES (target_order_id, auth.uid(), delivery_message, delivery_file_url, delivery_file_name)
  RETURNING id INTO deliverable_id;

  UPDATE orders
  SET order_status = 'DELIVERED',
      status = 'delivered',
      delivered_at = TIMEZONE('utc'::text, NOW()),
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = target_order_id;

  SELECT id INTO conversation_id FROM conversations
  WHERE order_id = target_order_id
  LIMIT 1;

  IF conversation_id IS NOT NULL THEN
    INSERT INTO messages (
      conversation_id,
      sender_id,
      receiver_id,
      message,
      message_type,
      attachment_url,
      attachment_name,
      attachment_type,
      metadata
    )
    VALUES (
      conversation_id,
      auth.uid(),
      order_record.buyer_id,
      delivery_message,
      'DELIVERABLE',
      delivery_file_url,
      delivery_file_name,
      'deliverable',
      jsonb_build_object('order_id', target_order_id, 'deliverable_id', deliverable_id)
    );
  END IF;

  RETURN deliverable_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION accept_marketplace_delivery(target_order_id UUID)
RETURNS UUID AS $$
DECLARE
  order_record orders%ROWTYPE;
  release_reference TEXT;
BEGIN
  SELECT * INTO order_record FROM orders
  WHERE id = target_order_id
  FOR UPDATE;

  IF order_record.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF order_record.buyer_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the buyer can accept this delivery';
  END IF;

  IF order_record.order_status <> 'DELIVERED' THEN
    RAISE EXCEPTION 'Only delivered orders can be accepted';
  END IF;

  PERFORM ensure_wallet(order_record.seller_id);

  UPDATE wallets
  SET pending_balance = pending_balance - order_record.seller_earnings,
      available_balance = available_balance + order_record.seller_earnings,
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE user_id = order_record.seller_id
  AND pending_balance >= order_record.seller_earnings;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient pending balance for release';
  END IF;

  UPDATE orders
  SET order_status = 'COMPLETED',
      status = 'completed',
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = target_order_id;

  release_reference := 'REL-' || REPLACE(target_order_id::TEXT, '-', '') || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT;

  INSERT INTO transactions (user_id, order_id, type, amount, status, reference)
  VALUES (order_record.seller_id, target_order_id, 'RELEASE', order_record.seller_earnings, 'COMPLETED', release_reference);

  RETURN target_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION request_order_revision(
  target_order_id UUID,
  revision_message TEXT
)
RETURNS UUID AS $$
DECLARE
  order_record orders%ROWTYPE;
  conversation_id UUID;
  message_id UUID;
BEGIN
  SELECT * INTO order_record FROM orders
  WHERE id = target_order_id
  FOR UPDATE;

  IF order_record.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF order_record.buyer_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the buyer can request a revision';
  END IF;

  IF order_record.order_status <> 'DELIVERED' THEN
    RAISE EXCEPTION 'Only delivered orders can receive revision requests';
  END IF;

  UPDATE orders
  SET order_status = 'REVISION_REQUESTED',
      status = 'active',
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = target_order_id;

  SELECT id INTO conversation_id FROM conversations
  WHERE order_id = target_order_id
  LIMIT 1;

  IF conversation_id IS NOT NULL THEN
    INSERT INTO messages (conversation_id, sender_id, receiver_id, message, message_type, metadata)
    VALUES (
      conversation_id,
      auth.uid(),
      order_record.seller_id,
      revision_message,
      'SYSTEM',
      jsonb_build_object('order_id', target_order_id, 'event', 'revision_requested')
    )
    RETURNING id INTO message_id;
  END IF;

  INSERT INTO notifications (user_id, actor_id, conversation_id, order_id, type, title, body)
  VALUES (
    order_record.seller_id,
    auth.uid(),
    conversation_id,
    target_order_id,
    'REVISION_REQUEST',
    'Revision requested',
    revision_message
  );

  RETURN target_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION request_withdrawal(
  withdrawal_amount INTEGER,
  target_bank_name TEXT,
  target_account_name TEXT,
  target_account_number TEXT
)
RETURNS UUID AS $$
DECLARE
  withdrawal_id UUID;
  withdrawal_reference TEXT;
BEGIN
  IF withdrawal_amount <= 0 THEN
    RAISE EXCEPTION 'Withdrawal amount must be greater than zero';
  END IF;

  PERFORM ensure_wallet(auth.uid());

  UPDATE wallets
  SET available_balance = available_balance - withdrawal_amount,
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE user_id = auth.uid()
  AND available_balance >= withdrawal_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient available balance';
  END IF;

  INSERT INTO withdrawals (user_id, amount, bank_name, account_name, account_number)
  VALUES (auth.uid(), withdrawal_amount, target_bank_name, target_account_name, target_account_number)
  RETURNING id INTO withdrawal_id;

  withdrawal_reference := 'WDR-' || REPLACE(withdrawal_id::TEXT, '-', '');

  INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
  VALUES (
    auth.uid(),
    'WITHDRAWAL',
    withdrawal_amount,
    'PENDING',
    withdrawal_reference,
    jsonb_build_object('withdrawal_id', withdrawal_id)
  );

  RETURN withdrawal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION approve_withdrawal(target_withdrawal_id UUID, mark_paid BOOLEAN DEFAULT FALSE)
RETURNS UUID AS $$
DECLARE
  next_status withdrawal_status;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can approve withdrawals';
  END IF;

  next_status := CASE WHEN mark_paid THEN 'PAID'::withdrawal_status ELSE 'APPROVED'::withdrawal_status END;

  UPDATE withdrawals
  SET status = next_status,
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = target_withdrawal_id
  AND status IN ('PENDING', 'APPROVED');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal cannot be approved';
  END IF;

  UPDATE transactions
  SET status = CASE WHEN mark_paid THEN 'COMPLETED'::transaction_status ELSE 'PENDING'::transaction_status END
  WHERE metadata->>'withdrawal_id' = target_withdrawal_id::TEXT;

  RETURN target_withdrawal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reject_withdrawal(target_withdrawal_id UUID, rejection_note TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  withdrawal_record withdrawals%ROWTYPE;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can reject withdrawals';
  END IF;

  SELECT * INTO withdrawal_record FROM withdrawals
  WHERE id = target_withdrawal_id
  FOR UPDATE;

  IF withdrawal_record.id IS NULL OR withdrawal_record.status <> 'PENDING' THEN
    RAISE EXCEPTION 'Withdrawal cannot be rejected';
  END IF;

  UPDATE wallets
  SET available_balance = available_balance + withdrawal_record.amount,
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE user_id = withdrawal_record.user_id;

  UPDATE withdrawals
  SET status = 'REJECTED',
      admin_note = rejection_note,
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = target_withdrawal_id;

  UPDATE transactions
  SET status = 'REVERSED'
  WHERE metadata->>'withdrawal_id' = target_withdrawal_id::TEXT;

  RETURN target_withdrawal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION seed_services_from_listings()
RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER;
BEGIN
  INSERT INTO services (seller_id, listing_id, title, description, price, is_active)
  SELECT seller_id, id, title, description, price_min, is_active
  FROM listings
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
