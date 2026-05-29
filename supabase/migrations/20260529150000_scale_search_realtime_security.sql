-- =====================================================================
-- KINGDOM MARKETPLACE: SCALABILITY & SEARCH UPGRADE (RUN SEVENTH)
-- Purpose: Adds indexes, search, and security improvements for scalability.
-- Execution Order: 7 (Run after workflow upgrade)
-- =====================================================================
-- Production scalability pass: ranked search, scoped inbox summaries, and safer message mutations.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_services_public_search
  ON services(category_slug, moderation_status, is_active, price, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_services_public_quality
  ON services(is_featured DESC, quality_score DESC, created_at DESC)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_profiles_user_rating
  ON profiles(user_id, rating DESC, reviews_count DESC);

CREATE INDEX IF NOT EXISTS idx_seller_profiles_user_quality
  ON seller_profiles(user_id, verification_status, profile_completion_score DESC, response_time_minutes);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_desc
  ON messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread
  ON messages(receiver_id, status, conversation_id, created_at DESC)
  WHERE status <> 'READ';

CREATE INDEX IF NOT EXISTS idx_conversations_buyer_updated
  ON conversations(buyer_id, last_message_at DESC NULLS LAST, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_seller_updated
  ON conversations(seller_id, last_message_at DESC NULLS LAST, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_typing_status_conversation_user
  ON typing_status(conversation_id, user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_presence_seen
  ON user_presence(user_id, updated_at DESC);

CREATE OR REPLACE FUNCTION marketplace_search_services(
  search_query TEXT DEFAULT NULL,
  target_category_slug TEXT DEFAULT NULL,
  min_price INTEGER DEFAULT NULL,
  max_price INTEGER DEFAULT NULL,
  result_sort TEXT DEFAULT 'popular',
  result_limit INTEGER DEFAULT 24,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  service_id UUID,
  ranking_score NUMERIC,
  total_count BIGINT
) AS $$
WITH normalized AS (
  SELECT
    NULLIF(TRIM(search_query), '') AS q,
    NULLIF(TRIM(target_category_slug), '') AS category_slug,
    LEAST(GREATEST(COALESCE(result_limit, 24), 1), 60) AS safe_limit,
    GREATEST(COALESCE(result_offset, 0), 0) AS safe_offset,
    COALESCE(NULLIF(result_sort, ''), 'popular') AS safe_sort
),
query_terms AS (
  SELECT
    normalized.*,
    CASE WHEN normalized.q IS NULL THEN NULL ELSE websearch_to_tsquery('english', normalized.q) END AS tsq
  FROM normalized
),
ranked AS (
  SELECT
    services.id,
    services.price,
    services.created_at,
    services.is_featured,
    COALESCE(services.quality_score, 0) AS quality_score,
    COALESCE(profiles.rating, 0) AS seller_rating,
    COALESCE(profiles.reviews_count, 0) AS seller_reviews,
    COALESCE(seller_profiles.profile_completion_score, 0) AS profile_completion_score,
    COALESCE(seller_profiles.response_time_minutes, 1440) AS response_time_minutes,
    seller_profiles.verification_status,
    CASE
      WHEN query_terms.tsq IS NULL THEN 0
      ELSE ts_rank_cd(services.search_vector, query_terms.tsq)
    END AS text_rank,
    CASE
      WHEN query_terms.q IS NOT NULL AND services.category_slug = query_terms.category_slug THEN 0.18
      WHEN query_terms.q IS NOT NULL AND services.category ILIKE '%' || query_terms.q || '%' THEN 0.12
      WHEN query_terms.q IS NOT NULL AND services.tags::TEXT ILIKE '%' || query_terms.q || '%' THEN 0.08
      ELSE 0
    END AS category_rank,
    (1 / (1 + (EXTRACT(EPOCH FROM (NOW() - services.created_at)) / 86400 / 30)))::NUMERIC AS recent_rank
  FROM services
  CROSS JOIN query_terms
  LEFT JOIN profiles ON profiles.user_id = services.seller_id
  LEFT JOIN seller_profiles ON seller_profiles.user_id = services.seller_id
  WHERE services.is_active = TRUE
    AND COALESCE(services.moderation_status::TEXT, services.status::TEXT, 'active') = 'active'
    AND (query_terms.category_slug IS NULL OR query_terms.category_slug = 'all' OR services.category_slug = query_terms.category_slug)
    AND (min_price IS NULL OR services.price >= min_price)
    AND (max_price IS NULL OR services.price <= max_price)
    AND (
      query_terms.q IS NULL
      OR services.search_vector @@ query_terms.tsq
      OR services.title ILIKE '%' || query_terms.q || '%'
      OR services.description ILIKE '%' || query_terms.q || '%'
      OR services.category ILIKE '%' || query_terms.q || '%'
      OR services.tags::TEXT ILIKE '%' || query_terms.q || '%'
    )
),
scored AS (
  SELECT
    ranked.id,
    ranked.price,
    ranked.created_at,
    ranked.is_featured,
    (
      ranked.text_rank * 1.7
      + ranked.category_rank
      + LEAST(ranked.seller_rating / 5, 1) * 0.22
      + LEAST(ranked.seller_reviews / 50.0, 1) * 0.12
      + LEAST(ranked.quality_score / 100.0, 1) * 0.16
      + LEAST(ranked.profile_completion_score / 100.0, 1) * 0.08
      + CASE WHEN ranked.verification_status = 'verified' THEN 0.1 ELSE 0 END
      + CASE WHEN ranked.response_time_minutes <= 120 THEN 0.05 ELSE 0 END
      + ranked.recent_rank * 0.15
      + CASE WHEN ranked.is_featured THEN 0.06 ELSE 0 END
    )::NUMERIC AS score
  FROM ranked
),
counted AS (
  SELECT
    scored.*,
    COUNT(*) OVER() AS total_rows
  FROM scored
)
SELECT
  counted.id AS service_id,
  ROUND(counted.score, 6) AS ranking_score,
  counted.total_rows AS total_count
FROM counted
CROSS JOIN normalized
ORDER BY
  CASE WHEN normalized.safe_sort IN ('popular', 'relevance') THEN counted.score END DESC NULLS LAST,
  CASE WHEN normalized.safe_sort = 'top_rated' THEN counted.score END DESC NULLS LAST,
  CASE WHEN normalized.safe_sort = 'featured' THEN counted.is_featured END DESC NULLS LAST,
  CASE WHEN normalized.safe_sort = 'price_low' THEN counted.price END ASC NULLS LAST,
  CASE WHEN normalized.safe_sort = 'price_high' THEN counted.price END DESC NULLS LAST,
  CASE WHEN normalized.safe_sort = 'newest' THEN counted.created_at END DESC NULLS LAST,
  counted.created_at DESC,
  counted.id ASC
LIMIT (SELECT safe_limit FROM normalized)
OFFSET (SELECT safe_offset FROM normalized);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_inbox_summaries(
  result_limit INTEGER DEFAULT 40,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  buyer_id UUID,
  seller_id UUID,
  order_id UUID,
  service_id UUID,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  buyer JSONB,
  seller JSONB,
  order_summary JSONB,
  last_message JSONB,
  unread_count INTEGER,
  other_presence JSONB
) AS $$
WITH scoped AS (
  SELECT conversations.*
  FROM conversations
  WHERE auth.uid() IN (conversations.buyer_id, conversations.seller_id)
),
limited AS (
  SELECT *
  FROM scoped
  ORDER BY COALESCE(last_message_at, updated_at, created_at) DESC, id DESC
  LIMIT LEAST(GREATEST(COALESCE(result_limit, 40), 1), 80)
  OFFSET GREATEST(COALESCE(result_offset, 0), 0)
),
last_messages AS (
  SELECT DISTINCT ON (messages.conversation_id)
    messages.*
  FROM messages
  JOIN limited ON limited.id = messages.conversation_id
  ORDER BY messages.conversation_id, messages.created_at DESC
),
unreads AS (
  SELECT
    messages.conversation_id,
    COUNT(*)::INTEGER AS unread_count
  FROM messages
  JOIN limited ON limited.id = messages.conversation_id
  WHERE messages.receiver_id = auth.uid()
    AND messages.status <> 'READ'
  GROUP BY messages.conversation_id
)
SELECT
  limited.id,
  limited.buyer_id,
  limited.seller_id,
  limited.order_id,
  limited.service_id,
  limited.status::TEXT,
  limited.created_at,
  limited.updated_at,
  limited.last_message_at,
  jsonb_build_object(
    'id', buyers.id,
    'full_name', buyers.full_name,
    'avatar_url', buyers.avatar_url,
    'role', buyers.role
  ) AS buyer,
  jsonb_build_object(
    'id', sellers.id,
    'full_name', sellers.full_name,
    'avatar_url', sellers.avatar_url,
    'role', sellers.role
  ) AS seller,
  CASE
    WHEN orders.id IS NULL THEN NULL
    ELSE jsonb_build_object(
      'id', orders.id,
      'title', orders.title,
      'status', orders.status,
      'order_status', orders.order_status,
      'payment_status', orders.payment_status
    )
  END AS order_summary,
  CASE
    WHEN last_messages.id IS NULL THEN NULL
    ELSE to_jsonb(last_messages)
  END AS last_message,
  COALESCE(unreads.unread_count, 0) AS unread_count,
  CASE
    WHEN presence.user_id IS NULL THEN NULL
    ELSE jsonb_build_object(
      'user_id', presence.user_id,
      'is_online', presence.is_online,
      'last_seen', presence.last_seen,
      'updated_at', presence.updated_at
    )
  END AS other_presence
FROM limited
JOIN users buyers ON buyers.id = limited.buyer_id
JOIN users sellers ON sellers.id = limited.seller_id
LEFT JOIN orders ON orders.id = limited.order_id
LEFT JOIN last_messages ON last_messages.conversation_id = limited.id
LEFT JOIN unreads ON unreads.conversation_id = limited.id
LEFT JOIN user_presence presence
  ON presence.user_id = CASE WHEN limited.buyer_id = auth.uid() THEN limited.seller_id ELSE limited.buyer_id END
ORDER BY COALESCE(limited.last_message_at, limited.updated_at, limited.created_at) DESC, limited.id DESC;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

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

  RETURN new_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Users can insert messages" ON messages;
CREATE POLICY "Participants can insert own messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1
      FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND auth.uid() IN (conversations.buyer_id, conversations.seller_id)
        AND messages.receiver_id = CASE
          WHEN conversations.buyer_id = auth.uid() THEN conversations.seller_id
          ELSE conversations.buyer_id
        END
    )
  );

DROP POLICY IF EXISTS "Users can update message status" ON messages;
DROP POLICY IF EXISTS "Participants can update delivery status" ON messages;
-- Message status changes now go through mark_conversation_read() so clients cannot update message bodies.

DROP POLICY IF EXISTS "Participants can read typing status" ON typing_status;
DROP POLICY IF EXISTS "Typing readable by conversation participants" ON typing_status;
CREATE POLICY "Participants can read typing status" ON typing_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM conversations
      WHERE conversations.id = typing_status.conversation_id
        AND auth.uid() IN (conversations.buyer_id, conversations.seller_id)
    )
  );

DROP POLICY IF EXISTS "Participants can update own typing status" ON typing_status;
DROP POLICY IF EXISTS "Users manage own typing status" ON typing_status;
CREATE POLICY "Participants can update own typing status" ON typing_status
  FOR ALL USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM conversations
      WHERE conversations.id = typing_status.conversation_id
        AND auth.uid() IN (conversations.buyer_id, conversations.seller_id)
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM conversations
      WHERE conversations.id = typing_status.conversation_id
        AND auth.uid() IN (conversations.buyer_id, conversations.seller_id)
    )
  );

DROP POLICY IF EXISTS "Presence readable by authenticated users" ON user_presence;
DROP POLICY IF EXISTS "Participants can read related presence" ON user_presence;
CREATE POLICY "Participants can read related presence" ON user_presence
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM conversations
      WHERE user_presence.user_id IN (conversations.buyer_id, conversations.seller_id)
        AND auth.uid() IN (conversations.buyer_id, conversations.seller_id)
    )
  );

DROP POLICY IF EXISTS "Users can manage own presence" ON user_presence;
CREATE POLICY "Users can manage own presence" ON user_presence
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON FUNCTION marketplace_search_services IS 'Ranked, paginated service search with text relevance, category fit, seller quality, and recency weighting.';
COMMENT ON FUNCTION get_inbox_summaries IS 'Scoped per-user inbox summary RPC for conversation previews and unread counts.';
COMMENT ON FUNCTION send_conversation_message IS 'Validated message mutation with participant checks and per-minute abuse throttling.';
