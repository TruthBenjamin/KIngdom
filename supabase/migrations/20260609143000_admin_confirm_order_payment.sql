-- Allow admins to recover orders where a provider callback/webhook or buyer
-- confirmation did not move the order out of awaiting payment.

CREATE OR REPLACE FUNCTION admin_confirm_order_payment(
  target_order_id UUID,
  target_payment_method TEXT DEFAULT 'loveworld_espees',
  confirmation_note TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  order_record orders%ROWTYPE;
  payment_method TEXT;
  payment_reference TEXT;
  hold_reference TEXT;
  has_escrow_hold BOOLEAN;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;

  SELECT * INTO order_record
  FROM orders
  WHERE id = target_order_id
  FOR UPDATE;

  IF order_record.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;

  IF order_record.payment_status = 'PAID' AND order_record.order_status <> 'PENDING_PAYMENT' THEN
    RETURN target_order_id;
  END IF;

  IF order_record.order_status <> 'PENDING_PAYMENT' THEN
    RAISE EXCEPTION 'Order is not awaiting payment';
  END IF;

  payment_method := CASE
    WHEN target_payment_method = 'loveworld_espees' THEN 'loveworld_espees'
    ELSE 'beta_card'
  END;
  payment_reference := 'ADMIN-PAY-' || REPLACE(target_order_id::TEXT, '-', '');
  hold_reference := 'ADMIN-HOLD-' || REPLACE(target_order_id::TEXT, '-', '');

  PERFORM ensure_wallet(order_record.seller_id);

  SELECT EXISTS (
    SELECT 1
    FROM transactions
    WHERE order_id = target_order_id
      AND type = 'ESCROW_HOLD'
  ) INTO has_escrow_hold;

  UPDATE orders
  SET payment_status = 'PAID',
      order_status = 'ACTIVE',
      status = 'active',
      updated_at = TIMEZONE('utc'::TEXT, NOW())
  WHERE id = target_order_id;

  INSERT INTO transactions (user_id, order_id, type, amount, status, reference, metadata)
  VALUES (
    order_record.buyer_id,
    target_order_id,
    'PAYMENT',
    order_record.amount,
    'COMPLETED',
    payment_reference,
    jsonb_build_object(
      'provider', 'admin',
      'payment_method', payment_method,
      'confirmed_by', auth.uid(),
      'note', confirmation_note
    )
  )
  ON CONFLICT (reference) DO NOTHING;

  IF NOT has_escrow_hold THEN
    UPDATE wallets
    SET pending_balance = pending_balance + order_record.seller_earnings,
        updated_at = TIMEZONE('utc'::TEXT, NOW())
    WHERE user_id = order_record.seller_id;

    INSERT INTO transactions (user_id, order_id, type, amount, status, reference, metadata)
    VALUES (
      order_record.seller_id,
      target_order_id,
      'ESCROW_HOLD',
      order_record.seller_earnings,
      'COMPLETED',
      hold_reference,
      jsonb_build_object(
        'provider', 'admin',
        'payment_method', payment_method,
        'confirmed_by', auth.uid(),
        'note', confirmation_note
      )
    )
    ON CONFLICT (reference) DO NOTHING;
  END IF;

  PERFORM log_order_event(
    target_order_id,
    auth.uid(),
    'admin_payment_confirmed',
    order_record.order_status::TEXT,
    'ACTIVE',
    jsonb_build_object('payment_method', payment_method, 'note', confirmation_note)
  );

  PERFORM write_admin_audit(
    'confirm_order_payment',
    'order',
    target_order_id,
    jsonb_build_object('payment_method', payment_method, 'note', confirmation_note)
  );

  RETURN target_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, auth, extensions;

GRANT EXECUTE ON FUNCTION admin_confirm_order_payment(UUID, TEXT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
