-- Stores hosted Espees payment references so callbacks can verify payment even
-- when the provider only redirects back with the marketplace order id.

CREATE TABLE IF NOT EXISTS payment_intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  method TEXT NOT NULL,
  reference TEXT NOT NULL,
  provider_payment_id TEXT NOT NULL,
  status TEXT DEFAULT 'created' NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'LWE' NOT NULL,
  redirect_url TEXT,
  metadata JSONB DEFAULT '{}'::JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  UNIQUE (provider, provider_payment_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_intents_order_id ON payment_intents(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status);

ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payment_intents_admin_all ON payment_intents;
CREATE POLICY payment_intents_admin_all ON payment_intents
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

NOTIFY pgrst, 'reload schema';
