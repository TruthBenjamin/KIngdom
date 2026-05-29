-- =====================================================================
-- KINGDOM MARKETPLACE: RICH SEED DATA
-- Purpose: Populates the marketplace with a realistic service-first ecosystem.
-- Logic: Consolidates around 'services', enforces order-based reviews, 
--        and seeds trust/moderation signals.
-- =====================================================================

-- 1. Setup Auth Users (Local development only)
-- These UUIDs match the public.users entries below.
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at)
VALUES 
  ('d290f1ee-6c54-4b01-90e6-d701748f0851', 'admin@kingdom.com', '{"full_name": "Kingdom Admin"}', NOW()),
  ('e390f1ee-6c54-4b01-90e6-d701748f0852', 'sarah.designer@test.com', '{"full_name": "Sarah Creative"}', NOW()),
  ('f490f1ee-6c54-4b01-90e6-d701748f0853', 'john.tech@test.com', '{"full_name": "John Tech"}', NOW()),
  ('a190f1ee-6c54-4b01-90e6-d701748f0854', 'pastor.mark@church.com', '{"full_name": "Pastor Mark"}', NOW()),
  ('b290f1ee-6c54-4b01-90e6-d701748f0855', 'jane.outreach@mission.org', '{"full_name": "Jane Mission"}', NOW())
ON CONFLICT (id) DO NOTHING;

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
  INSERT INTO public.orders (buyer_id, seller_id, service_id, title, amount, total_amount, payment_status, order_status, due_at, accepted_at, delivered_at)
  VALUES (
    'a190f1ee-6c54-4b01-90e6-d701748f0854', 
    'e390f1ee-6c54-4b01-90e6-d701748f0852', 
    (SELECT id FROM public.services WHERE slug = 'church-branding-pkg'),
    'Branding for Grace Community Church',
    45000, 47250, 'PAID', 'COMPLETED', 
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '19 days', NOW() - INTERVAL '6 days'
  ) RETURNING id, service_id, buyer_id, seller_id
)
INSERT INTO public.reviews (order_id, service_id, buyer_id, seller_id, rating, comment, status)
SELECT id, service_id, buyer_id, seller_id, 5, 'Sarah truly captured the heart of our church vision. Highly recommended!', 'published' 
FROM new_order;

-- Order B: Active Project with Conversations
WITH active_order AS (
  INSERT INTO public.orders (buyer_id, seller_id, service_id, title, amount, total_amount, payment_status, order_status, due_at, accepted_at)
  VALUES (
    'b290f1ee-6c54-4b01-90e6-d701748f0855', 
    'f490f1ee-6c54-4b01-90e6-d701748f0853', 
    (SELECT id FROM public.services WHERE slug = 'church-web-nextjs'),
    'Global Mission Portal Development',
    120000, 126000, 'PAID', 'ACTIVE', 
    NOW() + INTERVAL '20 days', NOW() - INTERVAL '2 days'
  ) RETURNING id, buyer_id, seller_id, service_id
),
new_conv AS (
  INSERT INTO public.conversations (buyer_id, seller_id, service_id, order_id, status)
  SELECT buyer_id, seller_id, service_id, id, 'active' FROM active_order
  RETURNING id, buyer_id, seller_id
)
INSERT INTO public.messages (conversation_id, sender_id, receiver_id, message, message_type)
SELECT id, buyer_id, seller_id, 'Hi John, we are excited to start the development!', 'TEXT' FROM new_conv
UNION ALL
SELECT id, seller_id, buyer_id, 'Me too! I am setting up the development environment now.', 'TEXT' FROM new_conv;

-- 7. Admin Moderation & Trust signals (Audit Phase 5: Verification & Safety)
INSERT INTO public.abuse_reports (reporter_id, target_type, target_id, reason, details, status, priority)
VALUES (
  'b290f1ee-6c54-4b01-90e6-d701748f0855', 
  'user', 
  'f490f1ee-6c54-4b01-90e6-d701748f0853', 
  'Suspicious Activity', 
  'User requested to communicate and pay via WhatsApp instead of the platform.', 
  'open', 
  'high'
);

INSERT INTO public.admin_audit_logs (actor_id, action, target_type, target_id, metadata)
VALUES (
  'd290f1ee-6c54-4b01-90e6-d701748f0851',
  'VERIFY_SELLER',
  'seller_profile',
  (SELECT id FROM public.seller_profiles WHERE user_id = 'e390f1ee-6c54-4b01-90e6-d701748f0852'),
  '{"method": "manual_review", "reason": "Portfolio validated and ID verified."}'
);

-- 8. Beta Financial History (Audit Phase 4: Simulated Escrow)
INSERT INTO public.manual_adjustments (user_id, order_id, adjustment_type, amount, reason, status)
VALUES (
  'e390f1ee-6c54-4b01-90e6-d701748f0852',
  (SELECT id FROM public.orders WHERE title = 'Branding for Grace Community Church'),
  'fee_correction',
  500,
  'Refunded platform fee for first-time seller promotion.',
  'recorded'
);

INSERT INTO public.suspicious_activities (user_id, activity_type, severity, status, metadata)
VALUES (
  'f490f1ee-6c54-4b01-90e6-d701748f0853',
  'OFF_PLATFORM_TALK',
  'medium',
  'reviewing',
  '{"keyword_matches": ["whatsapp", "telegram", "direct pay"]}'
);

-- Update profiles to reflect seeded ratings
UPDATE public.profiles 
SET rating = (SELECT AVG(rating) FROM public.reviews WHERE seller_id = profiles.user_id),
    reviews_count = (SELECT COUNT(*) FROM public.reviews WHERE seller_id = profiles.user_id)
WHERE is_seller = true;