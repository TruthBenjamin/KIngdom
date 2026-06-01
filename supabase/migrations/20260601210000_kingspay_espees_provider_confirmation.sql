-- Provider-backed Espees payment confirmation for KingsPay Goods & Services.

CREATE OR REPLACE FUNCTION confirm_provider_payment(
  target_order_id UUID,
  target_payment_method TEXT,
  target_provider TEXT,
  target_reference TEXT,
  target_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  order_record orders%ROWTYPE;
  payment_method TEXT;
  payment_provider TEXT;
  payment_reference TEXT;
  hold_reference TEXT;
BEGIN
  SELECT * INTO order_record FROM orders WHERE id = target_order_id FOR UPDATE;

  IF order_record.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;

  IF order_record.order_status <> 'PENDING_PAYMENT' AND order_record.payment_status = 'PAID' THEN
    RETURN target_order_id;
  END IF;

  IF order_record.order_status <> 'PENDING_PAYMENT' THEN
    RAISE EXCEPTION 'Order is not awaiting payment';
  END IF;

  payment_method := CASE
    WHEN target_payment_method = 'loveworld_espees' THEN 'loveworld_espees'
    ELSE 'beta_card'
  END;
  payment_provider := COALESCE(NULLIF(TRIM(target_provider), ''), 'provider');
  payment_reference := COALESCE(
    NULLIF(TRIM(target_reference), ''),
    UPPER(payment_provider) || '-PAY-' || REPLACE(target_order_id::TEXT, '-', '')
  );
  hold_reference := UPPER(payment_provider) || '-HOLD-' || REPLACE(target_order_id::TEXT, '-', '');

  PERFORM ensure_wallet(order_record.seller_id);

  UPDATE orders
  SET payment_status = 'PAID',
      order_status = 'ACTIVE',
      status = 'active',
      updated_at = TIMEZONE('utc'::TEXT, NOW())
  WHERE id = target_order_id;

  UPDATE wallets
  SET pending_balance = pending_balance + order_record.seller_earnings,
      updated_at = TIMEZONE('utc'::TEXT, NOW())
  WHERE user_id = order_record.seller_id;

  INSERT INTO transactions (user_id, order_id, type, amount, status, reference, metadata)
  VALUES (
    order_record.buyer_id,
    target_order_id,
    'PAYMENT',
    order_record.amount,
    'COMPLETED',
    payment_reference,
    COALESCE(target_metadata, '{}'::JSONB) || jsonb_build_object('provider', payment_provider, 'payment_method', payment_method)
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
    COALESCE(target_metadata, '{}'::JSONB) || jsonb_build_object('provider', payment_provider, 'payment_method', payment_method)
  )
  ON CONFLICT (reference) DO NOTHING;

  PERFORM log_order_event(
    target_order_id,
    NULL,
    'provider_payment_confirmed',
    order_record.order_status::TEXT,
    'ACTIVE',
    COALESCE(target_metadata, '{}'::JSONB) || jsonb_build_object('provider', payment_provider, 'payment_method', payment_method, 'reference', payment_reference)
  );

  RETURN target_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, auth, extensions;

GRANT EXECUTE ON FUNCTION confirm_provider_payment(UUID, TEXT, TEXT, TEXT, JSONB) TO service_role;

NOTIFY pgrst, 'reload schema';
