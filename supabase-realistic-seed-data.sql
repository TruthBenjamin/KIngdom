-- =====================================================================
-- KINGDOM MARKETPLACE: REALISTIC DEMO SEED DATA (RUN LAST)
-- Purpose: Inserts demo data for users, categories, profiles, etc.
-- Execution Order: 9 (Run after all schema and upgrade scripts)
-- =====================================================================
-- Kingdom Marketplace realistic demo seed data.
-- Run after supabase-schema.sql, supabase-messaging-upgrade.sql,
-- supabase-escrow-upgrade.sql, and supabase-marketplace-architecture-upgrade.sql.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mara@kingdom.test', '', NOW(), '{"full_name":"Mara Ellington","role":"seller","avatar_url":"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&h=240&fit=crop"}', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jonah@kingdom.test', '', NOW(), '{"full_name":"Jonah Reeves","role":"seller","avatar_url":"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&h=240&fit=crop"}', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'selah@kingdom.test', '', NOW(), '{"full_name":"Selah Brooks","role":"seller","avatar_url":"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&h=240&fit=crop"}', NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'gideon@kingdom.test', '', NOW(), '{"full_name":"Gideon Park","role":"seller","avatar_url":"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=240&h=240&fit=crop"}', NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'buyer@kingdom.test', '', NOW(), '{"full_name":"Grace Harbor Church","role":"buyer"}', NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    email_confirmed_at = COALESCE(auth.users.email_confirmed_at, EXCLUDED.email_confirmed_at),
    updated_at = NOW();

INSERT INTO users (id, email, full_name, avatar_url, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'mara@kingdom.test', 'Mara Ellington', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&h=240&fit=crop', 'seller'),
  ('22222222-2222-2222-2222-222222222222', 'jonah@kingdom.test', 'Jonah Reeves', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&h=240&fit=crop', 'seller'),
  ('33333333-3333-3333-3333-333333333333', 'selah@kingdom.test', 'Selah Brooks', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&h=240&fit=crop', 'seller'),
  ('44444444-4444-4444-4444-444444444444', 'gideon@kingdom.test', 'Gideon Park', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=240&h=240&fit=crop', 'seller'),
  ('55555555-5555-5555-5555-555555555555', 'buyer@kingdom.test', 'Grace Harbor Church', NULL, 'buyer')
ON CONFLICT (id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    role = EXCLUDED.role,
    updated_at = NOW();

DO $$
DECLARE
  missing_demo_users INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO missing_demo_users
  FROM (
    VALUES
      ('11111111-1111-1111-1111-111111111111'::UUID),
      ('22222222-2222-2222-2222-222222222222'::UUID),
      ('33333333-3333-3333-3333-333333333333'::UUID),
      ('44444444-4444-4444-4444-444444444444'::UUID),
      ('55555555-5555-5555-5555-555555555555'::UUID)
  ) AS demo_users(id)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.users
    WHERE public.users.id = demo_users.id
  );

  IF missing_demo_users > 0 THEN
    RAISE EXCEPTION 'Missing % demo public.users rows. Run this seed from the Supabase SQL Editor with service/admin privileges after the schema and upgrade SQL files.', missing_demo_users;
  END IF;
END $$;

INSERT INTO categories (name, slug, description, icon)
VALUES
  ('Brand Design', 'brand-design', 'Visual identity, launch systems, and campaign design for churches, founders, and creators.', 'BD'),
  ('Video Production', 'video-production', 'Editing, motion, short-form social clips, testimony films, and ministry recaps.', 'VP'),
  ('Worship Audio', 'worship-audio', 'Mixing, mastering, vocal production, podcast cleanup, and live worship support.', 'WA'),
  ('Web Development', 'web-development', 'Landing pages, church sites, commerce flows, integrations, and product dashboards.', 'WD'),
  ('Writing Strategy', 'writing-strategy', 'Copywriting, donor letters, curriculum edits, launch messaging, and content calendars.', 'WS'),
  ('Event Support', 'event-support', 'Planning assets, run-of-show consulting, volunteer systems, and conference operations.', 'ES')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon;

INSERT INTO profiles (user_id, bio, skills, is_seller, rating, reviews_count)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Identity designer helping churches and mission-led founders launch with clarity.', ARRAY['Brand systems','Web visuals','Launch assets'], TRUE, 4.95, 38),
  ('22222222-2222-2222-2222-222222222222', 'Video editor and motion designer focused on testimony films and social campaigns.', ARRAY['Video editing','Motion graphics','Short-form content'], TRUE, 4.88, 26),
  ('33333333-3333-3333-3333-333333333333', 'Audio engineer for worship teams, podcasts, devotionals, and live recordings.', ARRAY['Mixing','Mastering','Podcast cleanup'], TRUE, 4.91, 31),
  ('44444444-4444-4444-4444-444444444444', 'Full-stack builder shipping clean ministry sites, dashboards, and payment workflows.', ARRAY['Next.js','Supabase','Payments'], TRUE, 4.97, 44),
  ('55555555-5555-5555-5555-555555555555', 'Church team coordinating creative, web, and event projects.', ARRAY['Events','Creative direction','Communications'], FALSE, 0, 0)
ON CONFLICT (user_id) DO UPDATE
SET bio = EXCLUDED.bio,
    skills = EXCLUDED.skills,
    is_seller = EXCLUDED.is_seller,
    rating = EXCLUDED.rating,
    reviews_count = EXCLUDED.reviews_count,
    updated_at = NOW();

INSERT INTO seller_profiles (user_id, headline, location, response_time_minutes, verification_status, profile_completion_score, is_accepting_orders)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Brand systems for churches, ministries, and values-led startups', 'Atlanta', 42, 'verified', 96, TRUE),
  ('22222222-2222-2222-2222-222222222222', 'Testimony films, reels, and clean social edits with fast turnaround', 'Dallas', 68, 'verified', 91, TRUE),
  ('33333333-3333-3333-3333-333333333333', 'Warm worship mixes, podcast polish, and vocal production', 'Nashville', 55, 'verified', 94, TRUE),
  ('44444444-4444-4444-4444-444444444444', 'Premium ministry websites and commerce workflows built in Next.js', 'Seattle', 35, 'verified', 98, TRUE)
ON CONFLICT (user_id) DO UPDATE
SET headline = EXCLUDED.headline,
    location = EXCLUDED.location,
    response_time_minutes = EXCLUDED.response_time_minutes,
    verification_status = EXCLUDED.verification_status,
    profile_completion_score = EXCLUDED.profile_completion_score,
    is_accepting_orders = EXCLUDED.is_accepting_orders,
    updated_at = NOW();

INSERT INTO buyer_profiles (user_id, organization_name, buyer_type, project_interests, default_project_brief, verification_status, profile_completion_score)
VALUES
  ('55555555-5555-5555-5555-555555555555', 'Grace Harbor Church', 'church', ARRAY['brand design','video production','event support'], 'We usually need clean creative assets, realistic timelines, and help translating sermon series or events into digital campaigns.', 'pending', 82)
ON CONFLICT (user_id) DO UPDATE
SET organization_name = EXCLUDED.organization_name,
    buyer_type = EXCLUDED.buyer_type,
    project_interests = EXCLUDED.project_interests,
    default_project_brief = EXCLUDED.default_project_brief,
    verification_status = EXCLUDED.verification_status,
    profile_completion_score = EXCLUDED.profile_completion_score,
    updated_at = NOW();

INSERT INTO listings (id, seller_id, title, description, category, price_min, price_max, delivery_days, images, is_active)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', 'Church launch brand identity system', 'A complete identity package for a church plant, conference, or ministry launch.', 'Brand Design', 850, 2400, 10, ARRAY['https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&h=900&fit=crop'], TRUE),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '11111111-1111-1111-1111-111111111111', 'Sermon series visual campaign', 'A cohesive visual direction for a 4-8 week sermon series across slides, social, and print.', 'Brand Design', 320, 900, 5, ARRAY['https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&h=900&fit=crop'], TRUE),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '22222222-2222-2222-2222-222222222222', 'Testimony video edit', 'A polished 2-4 minute testimony story with pacing, lower thirds, color, and music bed.', 'Video Production', 450, 1200, 6, ARRAY['https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&h=900&fit=crop'], TRUE),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '22222222-2222-2222-2222-222222222222', 'Conference recap reel package', 'Short-form event reels and a hero recap for churches, conferences, and nonprofit gatherings.', 'Video Production', 600, 1800, 7, ARRAY['https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&h=900&fit=crop'], TRUE),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', '33333333-3333-3333-3333-333333333333', 'Worship single mix and master', 'A warm, release-ready mix for worship singles, live sessions, or acoustic recordings.', 'Worship Audio', 280, 850, 5, ARRAY['https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&h=900&fit=crop'], TRUE),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', '33333333-3333-3333-3333-333333333333', 'Podcast cleanup and leveling', 'Clear dialogue cleanup, leveling, intro/outro placement, and export for podcast episodes.', 'Worship Audio', 95, 240, 2, ARRAY['https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&h=900&fit=crop'], TRUE),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', '44444444-4444-4444-4444-444444444444', 'Premium church website build', 'A fast, responsive website with events, giving links, team pages, and sermon structure.', 'Web Development', 1800, 5200, 14, ARRAY['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=900&fit=crop'], TRUE),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', '44444444-4444-4444-4444-444444444444', 'Registration and payment workflow', 'A clean event registration flow with confirmations, payment handoff, and admin visibility.', 'Web Development', 950, 2600, 9, ARRAY['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=900&fit=crop'], TRUE)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    price_min = EXCLUDED.price_min,
    price_max = EXCLUDED.price_max,
    delivery_days = EXCLUDED.delivery_days,
    images = EXCLUDED.images,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

INSERT INTO services (seller_id, listing_id, title, slug, description, category, category_slug, price, delivery_days, revision_count, requirements, media_url, tags, is_featured, status, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Build a complete church launch brand identity', 'church-launch-brand-identity', 'A focused identity sprint for church plants, ministries, conferences, and mission-led teams. Includes logo direction, type/color system, launch graphics, and usage notes so your team can keep the brand consistent after delivery.', 'Brand Design', 'brand-design', 1250, 10, 2, 'Share your organization story, audience, inspiration references, must-use names, and any existing logo files.', 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&h=900&fit=crop', ARRAY['identity','church plant','launch','logo'], TRUE, 'active', TRUE),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Design a sermon series campaign kit', 'sermon-series-campaign-kit', 'A practical sermon series kit with a primary key art direction, slide backgrounds, social templates, lower-third graphics, and export guidance for your media team.', 'Brand Design', 'brand-design', 480, 5, 2, 'Send series title, scripture/theme notes, dates, output sizes, and any existing church brand guidelines.', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&h=900&fit=crop', ARRAY['sermon series','slides','social','campaign'], FALSE, 'active', TRUE),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'Edit a polished testimony video', 'polished-testimony-video-edit', 'Turn interview footage and b-roll into a clear, moving testimony film with story structure, music bed, lower thirds, color pass, captions, and social cutdowns.', 'Video Production', 'video-production', 650, 6, 2, 'Upload footage, transcript or story notes, brand files, music preferences, and target runtime.', 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&h=900&fit=crop', ARRAY['testimony','video edit','captions','story'], TRUE, 'active', TRUE),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'Create conference recap reels', 'conference-recap-reels', 'A post-event content package with one hero recap and up to five vertical reels for Instagram, TikTok, YouTube Shorts, and email follow-up.', 'Video Production', 'video-production', 890, 7, 2, 'Send raw footage, schedule, speaker names, logo files, and examples of the pace you like.', 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&h=900&fit=crop', ARRAY['reels','event recap','conference','shorts'], FALSE, 'active', TRUE),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'Mix and master a worship single', 'worship-single-mix-master', 'A warm, release-ready worship mix with vocal tuning touchups, instrument balance, stereo master, and alternate instrumental/acapella exports on request.', 'Worship Audio', 'worship-audio', 420, 5, 2, 'Send stems, reference tracks, BPM, key, lyric sheet, and export requirements.', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&h=900&fit=crop', ARRAY['mixing','mastering','worship','vocals'], TRUE, 'active', TRUE),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 'Clean and level your podcast audio', 'podcast-audio-cleanup-leveling', 'Dialogue cleanup for sermons, devotionals, and podcast interviews. Includes noise reduction, leveling, intro/outro placement, and platform-ready exports.', 'Worship Audio', 'worship-audio', 140, 2, 1, 'Send WAV/MP3 files, intro/outro clips, host names, and preferred loudness target if you have one.', 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&h=900&fit=crop', ARRAY['podcast','cleanup','sermon audio','editing'], FALSE, 'active', TRUE),
  ('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', 'Build a premium church website', 'premium-church-website-build', 'A clean, fast church website built for visitors and staff. Includes responsive pages, sermon/event structure, giving and newsletter handoffs, SEO basics, and CMS-ready content sections.', 'Web Development', 'web-development', 2600, 14, 2, 'Send sitemap, brand files, copy drafts, domain/hosting notes, and integration needs.', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=900&fit=crop', ARRAY['nextjs','church website','cms','seo'], TRUE, 'active', TRUE),
  ('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', 'Create an event registration workflow', 'event-registration-payment-workflow', 'A streamlined registration and payment workflow for conferences, retreats, classes, or paid events. Includes form flow, confirmation page, admin-friendly data structure, and payment handoff.', 'Web Development', 'web-development', 1450, 9, 2, 'Send event details, required fields, payment rules, confirmation copy, and team notification needs.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=900&fit=crop', ARRAY['registration','payments','events','supabase'], FALSE, 'active', TRUE)
ON CONFLICT (slug) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    category_slug = EXCLUDED.category_slug,
    price = EXCLUDED.price,
    delivery_days = EXCLUDED.delivery_days,
    revision_count = EXCLUDED.revision_count,
    requirements = EXCLUDED.requirements,
    media_url = EXCLUDED.media_url,
    tags = EXCLUDED.tags,
    is_featured = EXCLUDED.is_featured,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

INSERT INTO reviews (listing_id, buyer_id, seller_id, rating, comment)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 5, 'Mara translated a loose launch vision into a system our volunteer team could actually use. The handoff was clear, organized, and beautiful.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 5, 'The sermon graphics felt custom without becoming hard to maintain. Our slides, social posts, and lobby screens finally matched.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 5, 'Jonah found the heart of the story quickly and gave us edits that felt emotional without being heavy-handed.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 4, 'Fast turnaround, sharp pacing, and the vertical clips performed better than our usual event posts.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', '55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 5, 'Selah made a small-room worship recording feel warm and balanced. The vocal sat beautifully in the final mix.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', '55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 5, 'Our podcast audio became clear and consistent across episodes. Communication was direct and turnaround was reliable.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', '55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 5, 'Gideon brought product-level polish to a church website. The new structure is easier for visitors and easier for staff.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', '55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 5, 'The registration flow removed a lot of manual admin work. Clean UX, clean data, and no unnecessary complexity.')
ON CONFLICT (listing_id, buyer_id) DO UPDATE
SET rating = EXCLUDED.rating,
    comment = EXCLUDED.comment;

INSERT INTO saved_services (user_id, service_id)
SELECT '55555555-5555-5555-5555-555555555555', id
FROM services
WHERE slug IN ('church-launch-brand-identity', 'polished-testimony-video-edit', 'premium-church-website-build')
ON CONFLICT (user_id, service_id) DO NOTHING;
