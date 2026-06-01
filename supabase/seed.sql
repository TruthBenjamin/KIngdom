-- =====================================================================
-- KINGDOM MARKETPLACE: CANONICAL LOCAL/DEMO SEED DATA (OPTIONAL - RUN 5)
-- Purpose: Populates the marketplace with a realistic service-first ecosystem.
-- Execution Order: Current path run 5 of 5, after beta trust operations.
-- Safety: Local/demo only. Do not run in production because this inserts demo auth.users.
-- Required Context: Supabase local DB, service-role SQL editor, or another admin context
--                   that is allowed to insert into auth.users.
-- Logic: Consolidates around 'services', enforces order-based reviews, 
--        and seeds trust/moderation signals.
-- =====================================================================

-- 0. Idempotency support for databases upgraded from older schemas.
-- ON CONFLICT requires a matching unique or exclusion constraint/index.
-- These indexes make the demo seed rerunnable across canonical and legacy-upgraded DBs.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_seed_key
  ON public.profiles (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS seller_profiles_user_id_seed_key
  ON public.seller_profiles (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS buyer_profiles_user_id_seed_key
  ON public.buyer_profiles (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_seed_key
  ON public.categories (slug);

CREATE UNIQUE INDEX IF NOT EXISTS services_slug_seed_key
  ON public.services (slug);

CREATE UNIQUE INDEX IF NOT EXISTS reviews_order_id_seed_key
  ON public.reviews (order_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'reviews'
      AND column_name = 'listing_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.reviews ALTER COLUMN listing_id DROP NOT NULL;
  END IF;
END $$;

-- 1. Setup Auth Users (Local development only)
-- These UUIDs match the public.users entries below.
-- Using a CTE to ensure all auth users exist before public users reference them.
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES 
  ('d290f1ee-6c54-4b01-90e6-d701748f0851', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@kingdom.com', crypt('KingdomAdmin2026!', gen_salt('bf')), NOW(), '{"full_name": "Kingdom Admin", "role": "admin"}', NOW(), NOW()),
  ('e390f1ee-6c54-4b01-90e6-d701748f0852', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sarah.creative@test.com', '', NOW(), '{"full_name": "Sarah Creative", "role": "seller"}', NOW(), NOW()),
  ('f490f1ee-6c54-4b01-90e6-d701748f0853', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'john.tech@test.com', '', NOW(), '{"full_name": "John Tech", "role": "seller"}', NOW(), NOW()),
  ('a190f1ee-6c54-4b01-90e6-d701748f0854', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pastor.mark@church.com', '', NOW(), '{"full_name": "Pastor Mark", "role": "buyer"}', NOW(), NOW()),
  ('b290f1ee-6c54-4b01-90e6-d701748f0855', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jane.outreach@mission.org', '', NOW(), '{"full_name": "Jane Mission", "role": "buyer"}', NOW(), NOW()),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mara@kingdom.test', '', NOW(), '{"full_name":"Mara Ellington","role":"seller"}', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jonah@kingdom.test', '', NOW(), '{"full_name":"Jonah Reeves","role":"seller"}', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'selah@kingdom.test', '', NOW(), '{"full_name":"Selah Brooks","role":"seller"}', NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'gideon@kingdom.test', '', NOW(), '{"full_name":"Gideon Park","role":"seller"}', NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW();

-- 2. Populate Public Users (Role & Moderation consistency)
INSERT INTO public.users (id, email, full_name, role, moderation_status, risk_score)
VALUES 
  ('d290f1ee-6c54-4b01-90e6-d701748f0851', 'admin@kingdom.com', 'Kingdom Admin', 'admin', 'active', 0),
  ('e390f1ee-6c54-4b01-90e6-d701748f0852', 'sarah.creative@test.com', 'Sarah Creative', 'seller', 'active', 0),
  ('f490f1ee-6c54-4b01-90e6-d701748f0853', 'john.tech@test.com', 'John Tech', 'seller', 'active', 5),
  ('a190f1ee-6c54-4b01-90e6-d701748f0854', 'pastor.mark@church.com', 'Pastor Mark', 'buyer', 'active', 0),
  ('b290f1ee-6c54-4b01-90e6-d701748f0855', 'jane.outreach@mission.org', 'Jane Mission', 'buyer', 'active', 0),
  ('11111111-1111-1111-1111-111111111111', 'mara@kingdom.test', 'Mara Ellington', 'seller', 'active', 0),
  ('22222222-2222-2222-2222-222222222222', 'jonah@kingdom.test', 'Jonah Reeves', 'seller', 'active', 0),
  ('33333333-3333-3333-3333-333333333333', 'selah@kingdom.test', 'Selah Brooks', 'seller', 'active', 0),
  ('44444444-4444-4444-4444-444444444444', 'gideon@kingdom.test', 'Gideon Park', 'seller', 'active', 0)
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, moderation_status = EXCLUDED.moderation_status;

-- 3. Profiles & Specialized Roles (Audit Phase 2: Fix Onboarding)
INSERT INTO public.profiles (user_id, bio, is_seller, rating, reviews_count)
VALUES 
  ('d290f1ee-6c54-4b01-90e6-d701748f0851', 'Platform Administrator.', false, 0, 0),
  ('e390f1ee-6c54-4b01-90e6-d701748f0852', 'Graphic designer with 10 years experience in ministry branding. Passionate about helping churches tell their story visually.', true, 5.0, 1),
  ('f490f1ee-6c54-4b01-90e6-d701748f0853', 'Full-stack developer focused on digital solutions for ministries.', true, 0, 0),
  ('a190f1ee-6c54-4b01-90e6-d701748f0854', 'Lead pastor looking for creative talent to support our vision.', false, 0, 0),
  ('b290f1ee-6c54-4b01-90e6-d701748f0855', 'Outreach director at a global non-profit.', false, 0, 0),
  ('11111111-1111-1111-1111-111111111111', 'Identity designer helping churches and mission-led founders launch with clarity.', true, 4.95, 38),
  ('22222222-2222-2222-2222-222222222222', 'Video editor and motion designer focused on testimony films and social campaigns.', true, 4.88, 26),
  ('33333333-3333-3333-3333-333333333333', 'Audio engineer for worship teams, podcasts, devotionals, and live recordings.', true, 4.91, 31),
  ('44444444-4444-4444-4444-444444444444', 'Full-stack builder shipping clean ministry sites, dashboards, and payment workflows.', true, 4.97, 44)
ON CONFLICT (user_id) DO UPDATE SET bio = EXCLUDED.bio, is_seller = EXCLUDED.is_seller;

INSERT INTO public.seller_profiles (user_id, headline, verification_status, profile_completion_score, category_specializations)
VALUES 
  ('e390f1ee-6c54-4b01-90e6-d701748f0852', 'Professional Ministry Branding & Graphic Design', 'verified', 95, ARRAY['Branding', 'Visual Identity']),
  ('f490f1ee-6c54-4b01-90e6-d701748f0853', 'Church Technology & Web Solutions', 'pending', 75, ARRAY['Web Development', 'IT Systems']),
  ('11111111-1111-1111-1111-111111111111', 'Brand systems for churches, ministries, and values-led startups', 'verified', 96, ARRAY['Brand Design']),
  ('22222222-2222-2222-2222-222222222222', 'Testimony films, reels, and clean social edits with fast turnaround', 'verified', 91, ARRAY['Video Production']),
  ('33333333-3333-3333-3333-333333333333', 'Warm worship mixes, podcast polish, and vocal production', 'verified', 94, ARRAY['Worship Audio']),
  ('44444444-4444-4444-4444-444444444444', 'Premium ministry websites and commerce workflows built in Next.js', 'verified', 98, ARRAY['Web Development'])
ON CONFLICT (user_id) DO UPDATE SET headline = EXCLUDED.headline, verification_status = EXCLUDED.verification_status;

INSERT INTO public.buyer_profiles (user_id, organization_name, buyer_type)
VALUES 
  ('a190f1ee-6c54-4b01-90e6-d701748f0854', 'Grace Community Church', 'church'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0855', 'Global Mission Partners', 'ministry')
ON CONFLICT (user_id) DO UPDATE SET organization_name = EXCLUDED.organization_name;

-- 4. Marketplace Categories
INSERT INTO public.categories (name, slug, description, icon, is_active, sort_order) VALUES
  ('Brand Design', 'brand-design', 'Visual identity, launch systems, and campaign design.', 'Palette', true, 10),
  ('Video Production', 'video-production', 'Editing, motion, and testimony films.', 'Video', true, 20),
  ('Worship Audio', 'worship-audio', 'Mixing, mastering, and podcast cleanup.', 'Mic', true, 30),
  ('Web Development', 'web-development', 'Websites, apps, and digital platforms.', 'Globe', true, 40),
  ('Strategy & Growth', 'strategy-growth', 'Ministry consulting and leadership development.', 'TrendingUp', true, 50)
ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description, icon = EXCLUDED.icon;

-- 5. Services (Audit Phase 2: Service-First Consolidation)
INSERT INTO public.services (seller_id, title, slug, description, category, category_slug, price, delivery_days, revision_count, status, moderation_status)
VALUES 
  ('e390f1ee-6c54-4b01-90e6-d701748f0852', 'Complete Church Branding Package', 'church-branding-identity', 'A comprehensive visual identity package designed for modern ministries. Includes a primary logo, secondary marks, color palette, typography guidelines, and social media templates for Instagram and Facebook.', 'Brand Design', 'brand-design', 45000, 14, 3, 'active', 'active'),
  ('e390f1ee-6c54-4b01-90e6-d701748f0852', 'Sermon Series Graphic Pack', 'sermon-graphics-pack', 'Custom visual identity for your next sermon series. Includes title slide and social promo graphics.', 'Brand Design', 'brand-design', 15000, 5, 2, 'active', 'active'),
  ('f490f1ee-6c54-4b01-90e6-d701748f0853', 'Custom Church Website (Next.js)', 'church-web-nextjs', 'A high-performance website for your ministry. Built with Next.js and SEO optimized.', 'Web Development', 'web-development', 120000, 30, 5, 'active', 'active'),
  ('11111111-1111-1111-1111-111111111111', 'Church launch brand identity system', 'church-launch-brand-identity', 'A complete identity package for a church plant, conference, or ministry launch.', 'Brand Design', 'brand-design', 85000, 10, 2, 'active', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Edit a polished testimony video', 'polished-testimony-video-edit', 'Turn interview footage and b-roll into a clear, moving testimony film with story structure, music bed, lower thirds, and captions.', 'Video Production', 'video-production', 65000, 6, 2, 'active', 'active'),
  ('33333333-3333-3333-3333-333333333333', 'Mix and master a worship single', 'worship-single-mix-master', 'A warm, release-ready worship mix with vocal tuning touchups, instrument balance, and stereo master.', 'Worship Audio', 'worship-audio', 42000, 5, 2, 'active', 'active'),
  ('44444444-4444-4444-4444-444444444444', 'Build a premium church website', 'premium-church-website-build', 'A clean, fast church website built for visitors and staff. Includes responsive pages, sermon/event structure, and CMS-ready sections.', 'Web Development', 'web-development', 260000, 14, 2, 'active', 'active')
ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price, moderation_status = EXCLUDED.moderation_status;

-- 6. Transactional Logic (Audit Phase 3: Orders, Messaging, and Verified Reviews)

-- Order A: Completed Lifecycle (Leads to a Verified Review)
WITH new_order AS (
  INSERT INTO public.orders (id, buyer_id, seller_id, service_id, title, amount, total_amount, payment_status, order_status, status, due_at, accepted_at, delivered_at)
  VALUES (
    'c190f1ee-6c54-4b01-90e6-d701748f0856',
    'a190f1ee-6c54-4b01-90e6-d701748f0854', 
    'e390f1ee-6c54-4b01-90e6-d701748f0852', 
    (SELECT id FROM public.services WHERE slug = 'church-branding-identity'),
    'Branding for Grace Community Church',
    45000, 47250, 'PAID', 'COMPLETED', 'completed',
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '19 days', NOW() - INTERVAL '6 days'
  )
  ON CONFLICT (id) DO UPDATE
  SET payment_status = EXCLUDED.payment_status, order_status = EXCLUDED.order_status, status = EXCLUDED.status
  RETURNING id, service_id, buyer_id, seller_id
)
INSERT INTO public.reviews (order_id, service_id, buyer_id, seller_id, rating, comment, status)
SELECT id, service_id, buyer_id, seller_id, 5, 'Sarah truly captured the heart of our church vision. Highly recommended!', 'published' 
FROM new_order
ON CONFLICT (order_id) DO UPDATE
SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, status = EXCLUDED.status;

-- Order B: Active Project with Conversations
WITH active_order AS (
  INSERT INTO public.orders (id, buyer_id, seller_id, service_id, title, amount, total_amount, payment_status, order_status, status, due_at, accepted_at)
  VALUES (
    'c290f1ee-6c54-4b01-90e6-d701748f0857',
    'b290f1ee-6c54-4b01-90e6-d701748f0855', 
    'f490f1ee-6c54-4b01-90e6-d701748f0853', 
    (SELECT id FROM public.services WHERE slug = 'church-web-nextjs'),
    'Global Mission Portal Development',
    120000, 126000, 'PAID', 'ACTIVE', 'active',
    NOW() + INTERVAL '20 days', NOW() - INTERVAL '2 days'
  )
  ON CONFLICT (id) DO UPDATE
  SET payment_status = EXCLUDED.payment_status, order_status = EXCLUDED.order_status, status = EXCLUDED.status
  RETURNING id, buyer_id, seller_id, service_id
),
new_conv AS (
  INSERT INTO public.conversations (id, buyer_id, seller_id, service_id, order_id, status)
  SELECT 'c390f1ee-6c54-4b01-90e6-d701748f0858', buyer_id, seller_id, service_id, id, 'active' FROM active_order
  ON CONFLICT (id) DO UPDATE
  SET status = EXCLUDED.status
  RETURNING id, buyer_id, seller_id
)
INSERT INTO public.messages (conversation_id, sender_id, receiver_id, message, message_type)
SELECT id, buyer_id, seller_id, 'Hi John, we are excited to start the development!', 'TEXT'::message_type
FROM new_conv
WHERE NOT EXISTS (
  SELECT 1 FROM public.messages
  WHERE conversation_id = new_conv.id
    AND message = 'Hi John, we are excited to start the development!'
)
UNION ALL
SELECT id, seller_id, buyer_id, 'Me too! I am setting up the development environment now.', 'TEXT'::message_type
FROM new_conv
WHERE NOT EXISTS (
  SELECT 1 FROM public.messages
  WHERE conversation_id = new_conv.id
    AND message = 'Me too! I am setting up the development environment now.'
);

-- 7. Admin Moderation & Trust signals (Audit Phase 5: Verification & Safety)
INSERT INTO public.abuse_reports (reporter_id, target_type, target_id, reason, details, status, priority)
SELECT
  'b290f1ee-6c54-4b01-90e6-d701748f0855', 
  'user', 
  'f490f1ee-6c54-4b01-90e6-d701748f0853', 
  'Suspicious Activity', 
  'User requested to communicate and pay via WhatsApp instead of the platform.', 
  'open', 
  'high'
WHERE NOT EXISTS (
  SELECT 1 FROM public.abuse_reports
  WHERE reporter_id = 'b290f1ee-6c54-4b01-90e6-d701748f0855'
    AND target_id = 'f490f1ee-6c54-4b01-90e6-d701748f0853'
    AND reason = 'Suspicious Activity'
);

INSERT INTO public.admin_audit_logs (actor_id, action, target_type, target_id, metadata)
SELECT
  'd290f1ee-6c54-4b01-90e6-d701748f0851',
  'VERIFY_SELLER',
  'seller_profile',
  (SELECT id FROM public.seller_profiles WHERE user_id = 'e390f1ee-6c54-4b01-90e6-d701748f0852'),
  '{"method": "manual_review", "reason": "Portfolio validated and ID verified."}'
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_audit_logs
  WHERE action = 'VERIFY_SELLER'
    AND target_id = (SELECT id FROM public.seller_profiles WHERE user_id = 'e390f1ee-6c54-4b01-90e6-d701748f0852')
);

-- 8. Beta Financial History (Audit Phase 4: Simulated Escrow)
INSERT INTO public.manual_adjustments (user_id, order_id, adjustment_type, amount, reason, status)
SELECT
  'e390f1ee-6c54-4b01-90e6-d701748f0852',
  (SELECT id FROM public.orders WHERE title = 'Branding for Grace Community Church'),
  'fee_correction',
  500,
  'Refunded platform fee for first-time seller promotion.',
  'recorded'
WHERE NOT EXISTS (
  SELECT 1 FROM public.manual_adjustments
  WHERE order_id = (SELECT id FROM public.orders WHERE title = 'Branding for Grace Community Church')
    AND adjustment_type = 'fee_correction'
);

INSERT INTO public.suspicious_activities (user_id, activity_type, severity, status, metadata)
SELECT
  'f490f1ee-6c54-4b01-90e6-d701748f0853',
  'OFF_PLATFORM_TALK',
  'medium',
  'reviewing',
  '{"keyword_matches": ["whatsapp", "telegram", "direct pay"]}'
WHERE NOT EXISTS (
  SELECT 1 FROM public.suspicious_activities
  WHERE user_id = 'f490f1ee-6c54-4b01-90e6-d701748f0853'
    AND activity_type = 'OFF_PLATFORM_TALK'
);

-- Update profiles to reflect seeded ratings
UPDATE public.profiles 
SET rating = COALESCE((SELECT AVG(rating) FROM public.reviews WHERE seller_id = profiles.user_id), 0),
    reviews_count = (SELECT COUNT(*) FROM public.reviews WHERE seller_id = profiles.user_id)
WHERE is_seller = true;
