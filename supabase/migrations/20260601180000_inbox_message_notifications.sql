-- =====================================================================
-- Inbox message notifications
-- Purpose: Create notification-center entries whenever a conversation
-- message is sent, and clear related inbox notifications when read.
-- =====================================================================

CREATE OR REPLACE FUNCTION create_inbox_message_notification(
  target_user_id UUID,
  target_actor_id UUID,
  target_conversation_id UUID,
  target_order_id UUID DEFAULT NULL,
  message_body TEXT DEFAULT '',
  target_message_type message_type DEFAULT 'TEXT',
  target_attachment_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  sender_name TEXT;
  notification_id UUID;
  notification_body TEXT;
BEGIN
  IF target_user_id IS NULL OR target_actor_id IS NULL OR target_conversation_id IS NULL THEN
    RAISE EXCEPTION 'Missing inbox notification target';
  END IF;

  SELECT COALESCE(NULLIF(TRIM(full_name), ''), 'Marketplace user')
  INTO sender_name
  FROM users
  WHERE id = target_actor_id;

  notification_body := CASE
    WHEN target_message_type = 'IMAGE' THEN 'Sent an image attachment.'
    WHEN target_message_type = 'FILE' THEN 'Sent a file: ' || COALESCE(NULLIF(TRIM(target_attachment_name), ''), 'Attachment')
    WHEN target_message_type = 'DELIVERABLE' THEN COALESCE(NULLIF(TRIM(message_body), ''), 'Sent an order deliverable.')
    WHEN target_message_type = 'SYSTEM' THEN COALESCE(NULLIF(TRIM(message_body), ''), 'Conversation updated.')
    ELSE COALESCE(NULLIF(TRIM(message_body), ''), 'Sent you a message.')
  END;

  INSERT INTO notifications (
    user_id,
    actor_id,
    conversation_id,
    order_id,
    type,
    title,
    body
  )
  VALUES (
    target_user_id,
    target_actor_id,
    target_conversation_id,
    target_order_id,
    'NEW_MESSAGE',
    'New message from ' || COALESCE(sender_name, 'Marketplace user'),
    LEFT(notification_body, 500)
  )
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_conversation_read(target_conversation_id UUID)
RETURNS INTEGER AS $$
DECLARE
  marked_count INTEGER;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM conversations
    WHERE conversations.id = target_conversation_id
      AND auth.uid() IN (conversations.buyer_id, conversations.seller_id)
  ) THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  WITH changed AS (
    UPDATE messages
    SET status = 'READ'
    WHERE conversation_id = target_conversation_id
      AND receiver_id = auth.uid()
      AND status <> 'READ'
    RETURNING id
  ),
  reads AS (
    INSERT INTO message_reads (message_id, user_id, read_at)
    SELECT changed.id, auth.uid(), NOW()
    FROM changed
    ON CONFLICT (message_id, user_id) DO UPDATE SET read_at = EXCLUDED.read_at
    RETURNING 1
  )
  SELECT COUNT(*)::INTEGER INTO marked_count FROM changed;

  UPDATE notifications
  SET is_read = TRUE
  WHERE user_id = auth.uid()
    AND conversation_id = target_conversation_id
    AND type = 'NEW_MESSAGE'
    AND is_read = FALSE;

  RETURN COALESCE(marked_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION send_conversation_message(
  target_conversation_id UUID,
  body TEXT DEFAULT '',
  target_message_type message_type DEFAULT 'TEXT',
  target_attachment_url TEXT DEFAULT NULL,
  target_attachment_type TEXT DEFAULT NULL,
  target_attachment_name TEXT DEFAULT NULL,
  target_attachment_size INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  conversation_record conversations%ROWTYPE;
  receiver UUID;
  new_message_id UUID;
  recent_count INTEGER;
BEGIN
  SELECT * INTO conversation_record
  FROM conversations
  WHERE id = target_conversation_id
    AND auth.uid() IN (buyer_id, seller_id);

  IF conversation_record.id IS NULL THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  IF COALESCE(LENGTH(TRIM(body)), 0) = 0 AND target_attachment_url IS NULL THEN
    RAISE EXCEPTION 'Message body or attachment is required';
  END IF;

  IF LENGTH(COALESCE(body, '')) > 4000 THEN
    RAISE EXCEPTION 'Message is too long';
  END IF;

  SELECT COUNT(*)::INTEGER INTO recent_count
  FROM messages
  WHERE sender_id = auth.uid()
    AND created_at > NOW() - INTERVAL '1 minute';

  IF recent_count >= 30 THEN
    RAISE EXCEPTION 'Message rate limit exceeded';
  END IF;

  IF target_attachment_url IS NOT NULL
    AND target_attachment_url !~ '/storage/v1/object/public/message-attachments/'
  THEN
    RAISE EXCEPTION 'Unsupported attachment URL';
  END IF;

  receiver := CASE
    WHEN conversation_record.buyer_id = auth.uid() THEN conversation_record.seller_id
    ELSE conversation_record.buyer_id
  END;

  INSERT INTO messages (
    conversation_id,
    sender_id,
    receiver_id,
    message,
    message_type,
    attachment_url,
    attachment_type,
    attachment_name,
    attachment_size,
    status
  )
  VALUES (
    conversation_record.id,
    auth.uid(),
    receiver,
    LEFT(TRIM(COALESCE(body, '')), 4000),
    target_message_type,
    target_attachment_url,
    target_attachment_type,
    target_attachment_name,
    target_attachment_size,
    'SENT'
  )
  RETURNING id INTO new_message_id;

  UPDATE conversations
  SET last_message_id = new_message_id,
      last_message_at = NOW(),
      updated_at = NOW()
  WHERE id = conversation_record.id;

  PERFORM create_inbox_message_notification(
    receiver,
    auth.uid(),
    conversation_record.id,
    conversation_record.order_id,
    body,
    target_message_type,
    target_attachment_name
  );

  RETURN new_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_inbox_message_notification IS 'Creates notification-center inbox entries for new conversation messages.';
COMMENT ON FUNCTION send_conversation_message IS 'Validated message mutation with participant checks, per-minute abuse throttling, and inbox notifications.';
