-- Adds a resilient beta payment confirmation path and records the selected
-- marketplace payment option, including Loveworld Espees.

CREATE OR REPLACE FUNCTION ensure_wallet(target_user_id UUID)
RETURNS UUID AS $$
DECLARE
  wallet_id UUID;
BEGIN
  INSERT INTO wallets (user_id)
  VALUES (target_user_id)
  ON CONFLICT (user_id) DO UPDATE
  SET updated_at = TIMEZONE('utc'::text, NOW())
  RETURNING id INTO wallet_id;

  RETURN wallet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_order_event(
  target_order_id UUID,
  actor UUID,
  event_name TEXT,
  previous_status TEXT DEFAULT NULL,
  next_status TEXT DEFAULT NULL,
  event_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO order_events (order_id, actor_id, event_type, previous_status, next_status, metadata)
  VALUES (target_order_id, actor, event_name, previous_status, next_status, event_metadata)
  RETURNING id INTO event_id;

  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION confirm_beta_payment(
  target_order_id UUID,
  target_payment_method TEXT DEFAULT 'beta_card'
)
RETURNS UUID AS $$
DECLARE
  order_record orders%ROWTYPE;
  payment_method TEXT;
  payment_reference TEXT;
  hold_reference TEXT;
BEGIN
  SELECT * INTO order_record FROM orders WHERE id = target_order_id FOR UPDATE;

  IF order_record.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF order_record.buyer_id <> auth.uid() THEN RAISE EXCEPTION 'Only the buyer can confirm payment'; END IF;
  IF order_record.order_status <> 'PENDING_PAYMENT' AND order_record.payment_status = 'PAID' THEN
    RETURN target_order_id;
  END IF;
  IF order_record.order_status <> 'PENDING_PAYMENT' THEN RAISE EXCEPTION 'Order is not awaiting payment'; END IF;

  payment_method := CASE
    WHEN target_payment_method = 'loveworld_espees' THEN 'loveworld_espees'
    ELSE 'beta_card'
  END;

  PERFORM ensure_wallet(order_record.seller_id);

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

  payment_reference := UPPER(CASE WHEN payment_method = 'loveworld_espees' THEN 'LWE' ELSE 'SIM' END)
    || '-PAY-' || REPLACE(target_order_id::TEXT, '-', '');
  hold_reference := UPPER(CASE WHEN payment_method = 'loveworld_espees' THEN 'LWE' ELSE 'SIM' END)
    || '-HOLD-' || REPLACE(target_order_id::TEXT, '-', '');

  INSERT INTO transactions (user_id, order_id, type, amount, status, reference, metadata)
  VALUES (
    order_record.buyer_id,
    target_order_id,
    'PAYMENT',
    order_record.amount,
    'COMPLETED',
    payment_reference,
    jsonb_build_object('provider', 'beta', 'payment_method', payment_method)
  )
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (user_id, order_id, type, amount, status, reference, metadata)
  VALUES (
    order_record.seller_id,
    target_order_id,
    'ESCROW_HOLD',
    order_record.seller_earnings,
    'COMPLETED',
    hold_reference,
    jsonb_build_object('provider', 'beta', 'payment_method', payment_method)
  )
  ON CONFLICT (reference) DO NOTHING;

  PERFORM log_order_event(
    target_order_id,
    auth.uid(),
    'payment_confirmed',
    order_record.order_status::TEXT,
    'ACTIVE',
    jsonb_build_object('provider', 'beta', 'payment_method', payment_method)
  );

  RETURN target_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
