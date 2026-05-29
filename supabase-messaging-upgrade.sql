-- =====================================================================
-- KINGDOM MARKETPLACE: MESSAGING UPGRADE (LEGACY ONLY)
-- Purpose: Adds/enhances messaging, orders, and related types. Adds columns and tables for real-time features.
-- Execution Order: Legacy path run 2, after supabase-schema.sql.
-- Current Path: Skip this when using supabase/schema/canonical.sql.
-- =====================================================================
-- Kingdom Marketplace realtime messaging upgrade.
-- Run this after the legacy base schema, then enable Realtime replication for:
-- conversations, messages, message_reads, typing_status, user_presence, notifications.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  CREATE TYPE message_type AS ENUM ('TEXT', 'IMAGE', 'FILE', 'DELIVERABLE', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE message_status AS ENUM ('SENT', 'DELIVERED', 'READ');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending',
    'active',
    'delivered',
    'revision_requested',
    'completed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE notification_type AS ENUM (
    'NEW_MESSAGE',
    'ORDER_DELIVERY',
    'REVISION_REQUEST',
    'PAYMENT_CONFIRMATION'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status order_status DEFAULT 'pending' NOT NULL,
  total_amount INTEGER DEFAULT 0 NOT NULL,
  due_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_buyer_id_seller_id_listing_id_key;
DROP INDEX IF EXISTS conversations_buyer_seller_order_unique;
CREATE UNIQUE INDEX conversations_buyer_seller_order_unique
  ON conversations (buyer_id, seller_id, COALESCE(order_id, '00000000-0000-0000-0000-000000000000'::uuid));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'content'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'message'
  ) THEN
    ALTER TABLE messages RENAME COLUMN content TO message;
  END IF;
END $$;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type message_type DEFAULT 'TEXT' NOT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_type TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_name TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_size INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS status message_status DEFAULT 'SENT' NOT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB;

UPDATE messages
SET receiver_id = CASE
  WHEN messages.sender_id = conversations.buyer_id THEN conversations.seller_id
  ELSE conversations.buyer_id
END
FROM conversations
WHERE messages.conversation_id = conversations.id
AND messages.receiver_id IS NULL;

CREATE TABLE IF NOT EXISTS message_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(message_id, user_id)
);

CREATE TABLE IF NOT EXISTS typing_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  is_typing BOOLEAN DEFAULT FALSE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  is_online BOOLEAN DEFAULT FALSE NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_conversations_order_id ON conversations(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_status ON messages(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON message_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_status_conversation_id ON typing_status(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

DO $$
DECLARE
  realtime_table TEXT;
BEGIN
  FOREACH realtime_table IN ARRAY ARRAY[
    'conversations',
    'messages',
    'message_reads',
    'typing_status',
    'user_presence',
    'notifications'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', realtime_table);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END LOOP;
END $$;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Conversations are readable by participants" ON conversations;
DROP POLICY IF EXISTS "Conversations insertable by participants" ON conversations;
DROP POLICY IF EXISTS "Conversations updateable by participants" ON conversations;
DROP POLICY IF EXISTS "Messages readable by participants" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Participants can update delivery status" ON messages;
DROP POLICY IF EXISTS "Orders readable by participants" ON orders;
DROP POLICY IF EXISTS "Orders updateable by seller or buyer" ON orders;
DROP POLICY IF EXISTS "Reads readable by participants" ON message_reads;
DROP POLICY IF EXISTS "Users can mark messages read" ON message_reads;
DROP POLICY IF EXISTS "Users can update own read receipts" ON message_reads;
DROP POLICY IF EXISTS "Typing readable by conversation participants" ON typing_status;
DROP POLICY IF EXISTS "Users manage own typing status" ON typing_status;
DROP POLICY IF EXISTS "Presence readable by authenticated users" ON user_presence;
DROP POLICY IF EXISTS "Users manage own presence" ON user_presence;
DROP POLICY IF EXISTS "Notifications readable by owner" ON notifications;
DROP POLICY IF EXISTS "Notifications updateable by owner" ON notifications;

CREATE POLICY "Orders readable by participants" ON orders
  FOR SELECT USING (
    auth.uid() = buyer_id
    OR auth.uid() = seller_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Orders updateable by seller or buyer" ON orders
  FOR UPDATE USING (
    auth.uid() = buyer_id
    OR auth.uid() = seller_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Conversations are readable by participants" ON conversations
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Conversations insertable by participants" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Conversations updateable by participants" ON conversations
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Messages readable by participants" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND receiver_id <> sender_id
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
      AND receiver_id IN (conversations.buyer_id, conversations.seller_id)
    )
  );

CREATE POLICY "Participants can update delivery status" ON messages
  FOR UPDATE USING (
    auth.uid() = receiver_id OR auth.uid() = sender_id
  ) WITH CHECK (
    auth.uid() = receiver_id OR auth.uid() = sender_id
  );

CREATE POLICY "Reads readable by participants" ON message_reads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages
      JOIN conversations ON conversations.id = messages.conversation_id
      WHERE messages.id = message_reads.message_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can mark messages read" ON message_reads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own read receipts" ON message_reads
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Typing readable by conversation participants" ON typing_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = typing_status.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users manage own typing status" ON typing_status
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Presence readable by authenticated users" ON user_presence
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users manage own presence" ON user_presence
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Notifications readable by owner" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Notifications updateable by owner" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION sync_message_side_effects()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_id = NEW.id,
      last_message_at = NEW.created_at,
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = NEW.conversation_id;

  INSERT INTO notifications (user_id, actor_id, conversation_id, type, title, body)
  VALUES (
    NEW.receiver_id,
    NEW.sender_id,
    NEW.conversation_id,
    CASE WHEN NEW.message_type = 'DELIVERABLE' THEN 'ORDER_DELIVERY'::notification_type ELSE 'NEW_MESSAGE'::notification_type END,
    CASE WHEN NEW.message_type = 'DELIVERABLE' THEN 'New delivery received' ELSE 'New message' END,
    LEFT(COALESCE(NULLIF(NEW.message, ''), COALESCE(NEW.attachment_name, 'Attachment')), 160)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_message_side_effects_trigger ON messages;
CREATE TRIGGER sync_message_side_effects_trigger
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION sync_message_side_effects();

CREATE OR REPLACE FUNCTION get_or_create_conversation(
  target_buyer_id UUID,
  target_seller_id UUID,
  target_order_id UUID DEFAULT NULL,
  target_listing_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
BEGIN
  IF auth.uid() NOT IN (target_buyer_id, target_seller_id) THEN
    RAISE EXCEPTION 'Not allowed to create this conversation';
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
    INSERT INTO conversations (buyer_id, seller_id, order_id, listing_id)
    VALUES (target_buyer_id, target_seller_id, target_order_id, target_listing_id)
    RETURNING id INTO conversation_id;
  ELSE
    UPDATE conversations
    SET listing_id = COALESCE(target_listing_id, listing_id),
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION send_order_delivery(
  target_order_id UUID,
  target_conversation_id UUID,
  delivery_message TEXT,
  delivery_file_url TEXT DEFAULT NULL,
  delivery_file_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  inserted_message_id UUID;
  target_receiver_id UUID;
BEGIN
  SELECT buyer_id INTO target_receiver_id FROM orders
  WHERE id = target_order_id AND seller_id = auth.uid();

  IF target_receiver_id IS NULL THEN
    RAISE EXCEPTION 'Only the seller can deliver this order';
  END IF;

  UPDATE orders
  SET status = 'delivered',
      delivered_at = TIMEZONE('utc'::text, NOW()),
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = target_order_id;

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
    target_conversation_id,
    auth.uid(),
    target_receiver_id,
    delivery_message,
    'DELIVERABLE',
    delivery_file_url,
    delivery_file_name,
    'deliverable',
    jsonb_build_object('order_id', target_order_id)
  )
  RETURNING id INTO inserted_message_id;

  INSERT INTO messages (conversation_id, sender_id, receiver_id, message, message_type, metadata)
  VALUES (
    target_conversation_id,
    auth.uid(),
    target_receiver_id,
    'Order delivered. Review the files and request revisions if needed.',
    'SYSTEM',
    jsonb_build_object('order_id', target_order_id)
  );

  RETURN inserted_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION request_order_revision(
  target_order_id UUID,
  target_conversation_id UUID,
  revision_message TEXT
)
RETURNS UUID AS $$
DECLARE
  inserted_message_id UUID;
  target_receiver_id UUID;
BEGIN
  SELECT seller_id INTO target_receiver_id FROM orders
  WHERE id = target_order_id AND buyer_id = auth.uid();

  IF target_receiver_id IS NULL THEN
    RAISE EXCEPTION 'Only the buyer can request a revision';
  END IF;

  UPDATE orders
  SET status = 'revision_requested',
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = target_order_id;

  INSERT INTO messages (conversation_id, sender_id, receiver_id, message, message_type, metadata)
  VALUES (
    target_conversation_id,
    auth.uid(),
    target_receiver_id,
    revision_message,
    'SYSTEM',
    jsonb_build_object('order_id', target_order_id, 'event', 'revision_requested')
  )
  RETURNING id INTO inserted_message_id;

  INSERT INTO notifications (user_id, actor_id, conversation_id, order_id, type, title, body)
  VALUES (target_receiver_id, auth.uid(), target_conversation_id, target_order_id, 'REVISION_REQUEST', 'Revision requested', revision_message);

  RETURN inserted_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  true,
  52428800,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users upload message attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users read message attachments" ON storage.objects;

CREATE POLICY "Users upload message attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'message-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users read message attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'message-attachments');
