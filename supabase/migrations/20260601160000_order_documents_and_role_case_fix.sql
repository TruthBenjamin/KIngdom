-- Repair role CASE typing used by save-service and messaging RPCs, then add
-- reviewable order requirement documents for buyers, creators, and moderators.

DO $$
BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'moderator';
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

CREATE OR REPLACE FUNCTION ensure_current_user_profile()
RETURNS UUID AS $$
DECLARE
  metadata JSONB := COALESCE(auth.jwt() -> 'user_metadata', '{}'::JSONB);
  next_email TEXT := COALESCE(auth.jwt() ->> 'email', auth.uid()::TEXT || '@unknown.local');
  next_name TEXT := COALESCE(metadata ->> 'full_name', metadata ->> 'name');
  next_avatar TEXT := COALESCE(metadata ->> 'avatar_url', metadata ->> 'picture');
  metadata_role TEXT := COALESCE(metadata ->> 'role', 'buyer');
  next_role user_role := 'buyer'::user_role;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  IF LOWER(next_email) = 'thefreelance35@gmail.com' THEN
    next_role := 'admin'::user_role;
  ELSIF metadata_role IN ('buyer', 'seller', 'admin', 'moderator') THEN
    next_role := metadata_role::user_role;
  END IF;

  INSERT INTO users (id, email, full_name, avatar_url, role, moderation_status)
  VALUES (auth.uid(), next_email, next_name, next_avatar, next_role, 'active')
  ON CONFLICT (id) DO UPDATE
  SET email = COALESCE(EXCLUDED.email, users.email),
      full_name = COALESCE(EXCLUDED.full_name, users.full_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
      role = CASE
        WHEN LOWER(COALESCE(EXCLUDED.email, users.email)) = 'thefreelance35@gmail.com' THEN 'admin'::user_role
        WHEN EXCLUDED.role IS NOT NULL AND users.role IS NULL THEN EXCLUDED.role
        ELSE users.role
      END,
      moderation_status = CASE
        WHEN LOWER(COALESCE(EXCLUDED.email, users.email)) = 'thefreelance35@gmail.com' THEN 'active'
        ELSE users.moderation_status
      END,
      updated_at = NOW();

  INSERT INTO profiles (user_id, is_seller)
  VALUES (auth.uid(), next_role = 'seller'::user_role)
  ON CONFLICT (user_id) DO NOTHING;

  IF next_role = 'seller'::user_role THEN
    INSERT INTO seller_profiles (user_id, profile_completion_score)
    VALUES (auth.uid(), 15)
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF next_role = 'buyer'::user_role THEN
    INSERT INTO buyer_profiles (user_id, profile_completion_score)
    VALUES (auth.uid(), 10)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, auth, extensions;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-documents',
  'order-documents',
  true,
  52428800,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Order documents readable by authenticated users" ON storage.objects;
CREATE POLICY "Order documents readable by authenticated users" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'order-documents' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can upload own order documents" ON storage.objects;
CREATE POLICY "Users can upload own order documents" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'order-documents'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own order documents" ON storage.objects;
CREATE POLICY "Users can delete own order documents" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'order-documents'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE TABLE IF NOT EXISTS order_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  review_status TEXT DEFAULT 'pending_review' NOT NULL CHECK (review_status IN ('pending_review', 'approved', 'rejected')),
  review_note TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE order_documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_order_documents_order_created ON order_documents(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_documents_review_status ON order_documents(review_status, created_at DESC);

DROP POLICY IF EXISTS "Order documents readable by participants or moderators" ON order_documents;
CREATE POLICY "Order documents readable by participants or moderators" ON order_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM orders
      WHERE orders.id = order_documents.order_id
        AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role::TEXT IN ('admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS "Order participants can add documents" ON order_documents;
CREATE POLICY "Order participants can add documents" ON order_documents
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM orders
      WHERE orders.id = order_documents.order_id
        AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Moderators can review order documents" ON order_documents;
CREATE POLICY "Moderators can review order documents" ON order_documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role::TEXT IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role::TEXT IN ('admin', 'moderator')
    )
  );

CREATE OR REPLACE FUNCTION add_order_document(
  target_order_id UUID,
  document_file_url TEXT,
  document_file_name TEXT,
  document_file_type TEXT DEFAULT NULL,
  document_file_size INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  document_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM orders
    WHERE orders.id = target_order_id
      AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF COALESCE(LENGTH(TRIM(document_file_url)), 0) = 0 OR COALESCE(LENGTH(TRIM(document_file_name)), 0) = 0 THEN
    RAISE EXCEPTION 'Document file details are required';
  END IF;

  INSERT INTO order_documents (order_id, uploaded_by, file_url, file_name, file_type, file_size)
  VALUES (
    target_order_id,
    auth.uid(),
    TRIM(document_file_url),
    TRIM(document_file_name),
    NULLIF(TRIM(document_file_type), ''),
    GREATEST(COALESCE(document_file_size, 0), 0)
  )
  RETURNING id INTO document_id;

  INSERT INTO order_events (order_id, actor_id, event_type, metadata)
  VALUES (
    target_order_id,
    auth.uid(),
    'document_uploaded',
    jsonb_build_object('document_id', document_id, 'file_name', document_file_name)
  );

  RETURN document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, auth, extensions;

CREATE OR REPLACE FUNCTION admin_review_order_document(
  target_document_id UUID,
  next_status TEXT,
  note TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  document_order_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
      AND users.role::TEXT IN ('admin', 'moderator')
  ) THEN
    RAISE EXCEPTION 'Moderator access required';
  END IF;

  IF next_status NOT IN ('pending_review', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Unsupported document review status';
  END IF;

  UPDATE order_documents
  SET review_status = next_status,
      review_note = NULLIF(TRIM(note), ''),
      reviewed_by = auth.uid(),
      reviewed_at = TIMEZONE('utc', NOW())
  WHERE id = target_document_id
  RETURNING order_id INTO document_order_id;

  IF document_order_id IS NULL THEN RAISE EXCEPTION 'Document not found'; END IF;

  INSERT INTO order_events (order_id, actor_id, event_type, metadata)
  VALUES (
    document_order_id,
    auth.uid(),
    'document_reviewed',
    jsonb_build_object('document_id', target_document_id, 'status', next_status, 'note', note)
  );

  RETURN target_document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, auth, extensions;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    GRANT EXECUTE ON FUNCTION add_order_document(UUID, TEXT, TEXT, TEXT, INTEGER) TO authenticated;
    GRANT EXECUTE ON FUNCTION admin_review_order_document(UUID, TEXT, TEXT) TO authenticated;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
