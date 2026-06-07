-- Replace demo placeholder/logo imagery with distinct seller and service media.
-- Safe to rerun: each statement targets stable demo emails/slugs.

UPDATE public.users
SET avatar_url = CASE email
  WHEN 'sarah.creative@test.com' THEN 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=320&h=320&fit=crop&auto=format'
  WHEN 'john.tech@test.com' THEN 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=320&h=320&fit=crop&auto=format'
  WHEN 'mara@kingdom.test' THEN 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=320&h=320&fit=crop&auto=format'
  WHEN 'jonah@kingdom.test' THEN 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=320&h=320&fit=crop&auto=format'
  WHEN 'selah@kingdom.test' THEN 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=320&h=320&fit=crop&auto=format'
  WHEN 'gideon@kingdom.test' THEN 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=320&h=320&fit=crop&auto=format'
  ELSE avatar_url
END,
updated_at = NOW()
WHERE email IN (
  'sarah.creative@test.com',
  'john.tech@test.com',
  'mara@kingdom.test',
  'jonah@kingdom.test',
  'selah@kingdom.test',
  'gideon@kingdom.test'
)
AND (
  avatar_url IS NULL
  OR avatar_url = ''
  OR avatar_url ILIKE '%kingdom-marketplace-logo%'
  OR avatar_url ILIKE '%kingdom-creator-collage%'
);

UPDATE public.services
SET media_url = CASE slug
  WHEN 'church-branding-identity' THEN 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&h=900&fit=crop&auto=format'
  WHEN 'sermon-graphics-pack' THEN 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&h=900&fit=crop&auto=format'
  WHEN 'church-web-nextjs' THEN 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=900&fit=crop&auto=format'
  WHEN 'church-launch-brand-identity' THEN 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1200&h=900&fit=crop&auto=format'
  WHEN 'sermon-series-campaign-kit' THEN 'https://images.unsplash.com/photo-1523726491678-bf852e717f6a?w=1200&h=900&fit=crop&auto=format'
  WHEN 'polished-testimony-video-edit' THEN 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&h=900&fit=crop&auto=format'
  WHEN 'conference-recap-reels' THEN 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&h=900&fit=crop&auto=format'
  WHEN 'worship-single-mix-master' THEN 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&h=900&fit=crop&auto=format'
  WHEN 'podcast-audio-cleanup-leveling' THEN 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&h=900&fit=crop&auto=format'
  WHEN 'premium-church-website-build' THEN 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=900&fit=crop&auto=format'
  WHEN 'event-registration-payment-workflow' THEN 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=900&fit=crop&auto=format'
  ELSE media_url
END,
updated_at = NOW()
WHERE slug IN (
  'church-branding-identity',
  'sermon-graphics-pack',
  'church-web-nextjs',
  'church-launch-brand-identity',
  'sermon-series-campaign-kit',
  'polished-testimony-video-edit',
  'conference-recap-reels',
  'worship-single-mix-master',
  'podcast-audio-cleanup-leveling',
  'premium-church-website-build',
  'event-registration-payment-workflow'
)
AND (
  media_url IS NULL
  OR media_url = ''
  OR media_url ILIKE '%kingdom-marketplace-logo%'
  OR media_url ILIKE '%kingdom-creator-collage%'
);
