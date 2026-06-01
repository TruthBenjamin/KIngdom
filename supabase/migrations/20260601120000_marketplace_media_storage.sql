-- Adds public media storage for profile photos, service/listing previews,
-- and message attachments used by buyer/seller conversations.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketplace-media',
  'marketplace-media',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Marketplace media readable by everyone" ON storage.objects;
CREATE POLICY "Marketplace media readable by everyone" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'marketplace-media');

DROP POLICY IF EXISTS "Users can upload own marketplace media" ON storage.objects;
CREATE POLICY "Users can upload own marketplace media" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'marketplace-media'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update own marketplace media" ON storage.objects;
CREATE POLICY "Users can update own marketplace media" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'marketplace-media'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'marketplace-media'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own marketplace media" ON storage.objects;
CREATE POLICY "Users can delete own marketplace media" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'marketplace-media'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  true,
  26214400,
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
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Message attachments readable by everyone" ON storage.objects;
CREATE POLICY "Message attachments readable by everyone" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'message-attachments');

DROP POLICY IF EXISTS "Users can upload own message attachments" ON storage.objects;
CREATE POLICY "Users can upload own message attachments" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'message-attachments'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own message attachments" ON storage.objects;
CREATE POLICY "Users can delete own message attachments" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'message-attachments'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );
