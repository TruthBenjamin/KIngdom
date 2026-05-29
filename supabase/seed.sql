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

-- 1. Setup Auth Users (Local development only)
-- These UUIDs match the public.users entries below.
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
  ('d290f1ee-6c54-4b01-90e6-d701748f0851', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@kingdom.com', '', NOW(), '{"full_name": "Kingdom Admin"}', NOW(), NOW()),
  ('e390f1ee-6c54-4b01-90e6-d701748f0852', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sarah.designer@test.com', '', NOW(), '{"full_name": "Sarah Creative"}', NOW(), NOW()),
  ('f490f1ee-6c54-4b01-90e6-d701748f0853', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'john.tech@test.com', '', NOW(), '{"full_name": "John Tech"}', NOW(), NOW()),
  ('a190f1ee-6c54-4b01-90e6-d701748f0854', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pastor.mark@church.com', '', NOW(), '{"full_name": "Pastor Mark"}', NOW(), NOW()),
  ('b290f1ee-6c54-4b01-90e6-d701748f0855', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jane.outreach@mission.org', '', NOW(), '{"full_name": "Jane Mission"}', NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW();

-- 2. Populate Public Users (Role & Moderation consistency)
INSERT INTO public.users (id, email, full_name, role, moderation_status, risk_score)
VALUES 
  ('d290f1ee-6c54-4b01-90e6-d701748f0851', 'admin@kingdom.com', 'Kingdom Admin', 'admin', 'active', 0),
  ('e390f1ee-6c54-4b01-90e6-d701748f0852', 'sarah.designer@test.com', 'Sarah Creative', 'seller', 'active', 0),
  ('f490f1ee-6c54-4b01-90e6-d701748f0853', 'john.tech@test.com', 'John Tech', 'seller', 'active', 5),
  ('a190f1ee-6c54-4b01-90e6-d701748f0854', 'pastor.mark@church.com', 'Pastor Mark', 'buyer', 'active', 0),
  ('b290f1ee-6c54-4b01-90e6-d701748f0855', 'jane.outreach@mission.org', 'Jane Mission', 'buyer', 'active', 0)
ON CONFLICT (id) DO NOTHING;

-- 3. Profiles & Specialized Roles (Audit Phase 2: Fix Onboarding)
INSERT INTO public.profiles (user_id, bio, is_seller, rating, reviews_count)
VALUES 
  ('d290f1ee-6c54-4b01-90e6-d701748f0851', 'Platform Administrator.', false, 0, 0),
  ('e390f1ee-6c54-4b01-90e6-d701748f0852', 'Graphic designer with 10 years experience in ministry branding. Passionate about helping churches tell their story visually.', true, 5.0, 1),
  ('f490f1ee-6c54-4b01-90e6-d701748f0853', 'Full-stack developer focused on digital solutions for ministries.', true, 0, 0),
  ('a190f1ee-6c54-4b01-90e6-d701748f0854', 'Lead pastor looking for creative talent to support our vision.', false, 0, 0),
  ('b290f1ee-6c54-4b01-90e6-d701748f0855', 'Outreach director at a global non-profit.', false, 0, 0)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.seller_profiles (user_id, headline, verification_status, profile_completion_score, category_specializations)
VALUES 
  ('e390f1ee-6c54-4b01-90e6-d701748f0852', 'Professional Ministry Branding & Graphic Design', 'verified', 95, ARRAY['Branding', 'Visual Identity']),
  ('f490f1ee-6c54-4b01-90e6-d701748f0853', 'Church Technology & Web Solutions', 'pending', 75, ARRAY['Web Development', 'IT Systems'])
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.buyer_profiles (user_id, organization_name, buyer_type)
VALUES 
  ('a190f1ee-6c54-4b01-90e6-d701748f0854', 'Grace Community Church', 'church'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0855', 'Global Mission Partners', 'ministry')
ON CONFLICT (user_id) DO NOTHING;

-- 4. Marketplace Categories
INSERT INTO public.categories (name, slug, description, icon, is_active, sort_order) VALUES
('Visual Branding', 'visual-branding', 'Logos, print design, and visual identities for ministries.', 'Palette', true, 10),
('Web & Digital', 'web-digital', 'Websites, apps, and digital platforms for churches.', 'Globe', true, 20),
('Video Production', 'video-production', 'Sermon openers, testimony videos, and social clips.', 'Video', true, 30),
('Copy & Content', 'copy-content', 'Sermon writing, blogging, and social media copy.', 'FileText', true, 40),
('Strategy & Growth', 'strategy-growth', 'Ministry consulting and leadership development.', 'TrendingUp', true, 50)
ON CONFLICT (slug) DO NOTHING;

-- 5. Services (Audit Phase 2: Service-First Consolidation)
INSERT INTO public.services (seller_id, title, slug, description, category, category_slug, price, delivery_days, revision_count, status, moderation_status)
VALUES 
  ('e390f1ee-6c54-4b01-90e6-d701748f0852', 'Complete Church Branding Package', 'church-branding-pkg', 'A comprehensive visual identity package including a primary logo, secondary marks, color palette, and social media templates.', 'Visual Branding', 'visual-branding', 45000, 14, 3, 'active', 'active'),
  ('e390f1ee-6c54-4b01-90e6-d701748f0852', 'Sermon Series Graphic Pack', 'sermon-graphics-pack', 'Custom visual identity for your next sermon series. Includes title slide and social promo graphics.', 'Visual Branding', 'visual-branding', 15000, 5, 2, 'active', 'active'),
  ('f490f1ee-6c54-4b01-90e6-d701748f0853', 'Custom Church Website (Next.js)', 'church-web-nextjs', 'A high-performance website for your ministry. Built with Next.js and SEO optimized.', 'Web & Digital', 'web-digital', 120000, 30, 5, 'active', 'active')
ON CONFLICT (slug) DO NOTHING;

-- 6. Transactional Logic (Audit Phase 3: Orders, Messaging, and Verified Reviews)

-- Order A: Completed Lifecycle (Leads to a Verified Review)
WITH new_order AS (
  INSERT INTO public.orders (id, buyer_id, seller_id, service_id, title, amount, total_amount, payment_status, order_status, due_at, accepted_at, delivered_at)
  VALUES (
    'c190f1ee-6c54-4b01-90e6-d701748f0856',
    'a190f1ee-6c54-4b01-90e6-d701748f0854', 
    'e390f1ee-6c54-4b01-90e6-d701748f0852', 
    (SELECT id FROM public.services WHERE slug = 'church-branding-pkg'),
    'Branding for Grace Community Church',
    45000, 47250, 'PAID', 'COMPLETED', 
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '19 days', NOW() - INTERVAL '6 days'
  )
  ON CONFLICT (id) DO UPDATE
  SET payment_status = EXCLUDED.payment_status,
      order_status = EXCLUDED.order_status
  RETURNING id, service_id, buyer_id, seller_id
)
INSERT INTO public.reviews (order_id, service_id, buyer_id, seller_id, rating, comment, status)
SELECT id, service_id, buyer_id, seller_id, 5, 'Sarah truly captured the heart of our church vision. Highly recommended!', 'published' 
FROM new_order
ON CONFLICT (order_id) DO UPDATE
SET rating = EXCLUDED.rating,
    comment = EXCLUDED.comment,
    status = EXCLUDED.status;

-- Order B: Active Project with Conversations
WITH active_order AS (
  INSERT INTO public.orders (id, buyer_id, seller_id, service_id, title, amount, total_amount, payment_status, order_status, due_at, accepted_at)
  VALUES (
    'c290f1ee-6c54-4b01-90e6-d701748f0857',
    'b290f1ee-6c54-4b01-90e6-d701748f0855', 
    'f490f1ee-6c54-4b01-90e6-d701748f0853', 
    (SELECT id FROM public.services WHERE slug = 'church-web-nextjs'),
    'Global Mission Portal Development',
    120000, 126000, 'PAID', 'ACTIVE', 
    NOW() + INTERVAL '20 days', NOW() - INTERVAL '2 days'
  )
  ON CONFLICT (id) DO UPDATE
  SET payment_status = EXCLUDED.payment_status,
      order_status = EXCLUDED.order_status
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
SELECT id, buyer_id, seller_id, 'Hi John, we are excited to start the development!', 'TEXT'
FROM new_conv
WHERE NOT EXISTS (
  SELECT 1 FROM public.messages
  WHERE conversation_id = new_conv.id
    AND message = 'Hi John, we are excited to start the development!'
)
UNION ALL
SELECT id, seller_id, buyer_id, 'Me too! I am setting up the development environment now.', 'TEXT'
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
