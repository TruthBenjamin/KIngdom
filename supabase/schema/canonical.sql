-- =====================================================================
-- KINGDOM MARKETPLACE: CANONICAL SCHEMA (RECOMMENDED FRESH INSTALL - RUN 1)
-- Purpose: Full schema for new environments. Defines all types, tables, and core structure.
-- Execution Order: Current path run 1 of 5.
-- Run Next: supabase/migrations/20260528210000_real_marketplace_workflows.sql
-- Do Not Mix: Do not run legacy root scripts before this on a fresh database.
-- =====================================================================
-- Canonical schema snapshot for new Kingdom Marketplace environments.
-- This is the service-first target model. Historical upgrade files are retained
-- only to migrate existing demo databases into this shape.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE service_status AS ENUM ('draft', 'pending_review', 'active', 'paused', 'rejected', 'archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE conversation_status AS ENUM ('active', 'archived', 'hired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE message_type AS ENUM ('TEXT', 'IMAGE', 'FILE', 'DELIVERABLE', 'SYSTEM'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE message_status AS ENUM ('SENT', 'DELIVERED', 'READ'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'REFUNDED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE marketplace_order_status AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'DELIVERED', 'REVISION_REQUESTED', 'COMPLETED', 'CANCELLED', 'DISPUTED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE transaction_type AS ENUM ('PAYMENT', 'ESCROW_HOLD', 'RELEASE', 'WITHDRAWAL', 'REFUND', 'FEE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE transaction_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE withdrawal_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE notification_type AS ENUM ('NEW_MESSAGE', 'ORDER_DELIVERY', 'REVISION_REQUEST', 'PAYMENT_CONFIRMATION'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE review_status AS ENUM ('published', 'hidden', 'flagged'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'SYSTEM_ALERT';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ABUSE_REPORT';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'MODERATION_ACTION';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'SELLER_VERIFICATION';

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'buyer' NOT NULL,
  is_banned BOOLEAN DEFAULT FALSE NOT NULL,
  moderation_status TEXT DEFAULT 'active' NOT NULL CHECK (moderation_status IN ('active', 'warned', 'restricted', 'banned')),
  ban_reason TEXT,
  risk_score INTEGER DEFAULT 0 NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  bio TEXT,
  skills TEXT[],
  social_links JSONB,
  profile_photo_url TEXT,
  is_seller BOOLEAN DEFAULT FALSE NOT NULL,
  rating NUMERIC(3, 2) DEFAULT 0 NOT NULL,
  reviews_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  sort_order INTEGER DEFAULT 100 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS seller_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  headline TEXT,
  location TEXT,
  response_time_minutes INTEGER,
  verification_status TEXT DEFAULT 'unverified' NOT NULL CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  profile_completion_score INTEGER DEFAULT 0 NOT NULL CHECK (profile_completion_score BETWEEN 0 AND 100),
  is_accepting_orders BOOLEAN DEFAULT TRUE NOT NULL,
  category_specializations TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
  portfolio_urls TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
  verification_note TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS buyer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  organization_name TEXT,
  buyer_type TEXT DEFAULT 'individual' NOT NULL CHECK (buyer_type IN ('individual', 'church', 'ministry', 'business')),
  project_interests TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
  default_project_brief TEXT,
  verification_status TEXT DEFAULT 'unverified' NOT NULL CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  profile_completion_score INTEGER DEFAULT 0 NOT NULL CHECK (profile_completion_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  legacy_listing_id UUID,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'General' NOT NULL,
  category_slug TEXT DEFAULT 'general' NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0),
  delivery_days INTEGER DEFAULT 3 NOT NULL CHECK (delivery_days > 0),
  revision_count INTEGER DEFAULT 1 NOT NULL CHECK (revision_count >= 0),
  requirements TEXT,
  media_url TEXT,
  portfolio_urls TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
  package_summary TEXT,
  cancellation_policy TEXT DEFAULT 'Buyer may request cancellation before work begins. Active orders require seller/admin review.' NOT NULL,
  quality_score INTEGER DEFAULT 0 NOT NULL CHECK (quality_score BETWEEN 0 AND 100),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  status TEXT DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'rejected')),
  moderation_status service_status DEFAULT 'draft' NOT NULL,
  takedown_reason TEXT,
  moderated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS saved_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, service_id)
);

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  available_balance INTEGER DEFAULT 0 NOT NULL CHECK (available_balance >= 0),
  pending_balance INTEGER DEFAULT 0 NOT NULL CHECK (pending_balance >= 0),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE RESTRICT NOT NULL,
  title TEXT NOT NULL,
  amount INTEGER DEFAULT 0 NOT NULL CHECK (amount >= 0),
  total_amount INTEGER DEFAULT 0 NOT NULL CHECK (total_amount >= 0),
  escrow_fee_percent NUMERIC(5, 2) DEFAULT 5 NOT NULL,
  escrow_fee_amount INTEGER DEFAULT 0 NOT NULL CHECK (escrow_fee_amount >= 0),
  seller_earnings INTEGER DEFAULT 0 NOT NULL CHECK (seller_earnings >= 0),
  payment_status payment_status DEFAULT 'PENDING' NOT NULL,
  order_status marketplace_order_status DEFAULT 'PENDING_PAYMENT' NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'active', 'delivered', 'revision_requested', 'completed', 'cancelled')),
  buyer_requirements TEXT,
  scope_confirmation TEXT,
  terms_accepted_at TIMESTAMPTZ,
  cancellation_policy TEXT,
  cancellation_reason TEXT,
  dispute_reason TEXT,
  revision_count INTEGER DEFAULT 0 NOT NULL,
  accepted_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS order_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  previous_status TEXT,
  next_status TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  type transaction_type NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  status transaction_status DEFAULT 'COMPLETED' NOT NULL,
  reference TEXT UNIQUE NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  status withdrawal_status DEFAULT 'PENDING' NOT NULL,
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS deliverables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  delivered_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_revenue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  source TEXT DEFAULT 'ESCROW_FEE' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  last_message_id UUID,
  last_message_at TIMESTAMPTZ,
  status conversation_status DEFAULT 'active' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  message_type message_type DEFAULT 'TEXT' NOT NULL,
  attachment_url TEXT,
  attachment_type TEXT,
  attachment_name TEXT,
  attachment_size INTEGER,
  status message_status DEFAULT 'SENT' NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS message_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  read_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(message_id, user_id)
);

CREATE TABLE IF NOT EXISTS typing_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  is_typing BOOLEAN DEFAULT FALSE NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT FALSE NOT NULL,
  last_seen TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  status review_status DEFAULT 'published' NOT NULL,
  moderation_note TEXT,
  moderated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS abuse_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'service', 'review', 'message', 'order')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  priority TEXT DEFAULT 'normal' NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  metadata JSONB DEFAULT '{}'::JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS suspicious_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  severity TEXT DEFAULT 'low' NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  metadata JSONB DEFAULT '{}'::JSONB NOT NULL,
  status TEXT DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS manual_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('refund_placeholder', 'credit_placeholder', 'debit_placeholder', 'fee_correction')),
  amount INTEGER DEFAULT 0 NOT NULL CHECK (amount >= 0),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'recorded' NOT NULL CHECK (status IN ('recorded', 'needs_provider_action', 'completed', 'voided')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_services_search_vector ON services USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_services_category_status ON services(category_slug, moderation_status, is_active);
CREATE INDEX IF NOT EXISTS idx_services_seller_status ON services(seller_id, moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_services_user_created ON saved_services(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_status ON orders(buyer_id, order_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_seller_status ON orders(seller_id, order_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_service_status ON orders(service_id, order_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_events_order_created ON order_events(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_status ON withdrawals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_deliverables_order_id ON deliverables(order_id);
CREATE INDEX IF NOT EXISTS idx_platform_revenue_order_id ON platform_revenue(order_id);
CREATE INDEX IF NOT EXISTS idx_conversations_service_id ON conversations(service_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_reads_user ON message_reads(user_id, read_at DESC);
CREATE INDEX IF NOT EXISTS idx_typing_status_conversation_user ON typing_status(conversation_id, user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_presence_seen ON user_presence(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_service_status ON reviews(service_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_moderation_status ON users(moderation_status, risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_abuse_reports_status_priority ON abuse_reports(status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_user_status ON suspicious_activities(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manual_adjustments_created ON manual_adjustments(created_at DESC);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE abuse_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspicious_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_adjustments ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE services IS 'Canonical marketplace entity.';
COMMENT ON TABLE reviews IS 'Verified buyer reviews tied to completed orders and services.';
COMMENT ON TABLE abuse_reports IS 'User-submitted trust and safety reports for beta moderation.';
COMMENT ON TABLE admin_audit_logs IS 'Admin operation history for moderation and finance actions.';
COMMENT ON TABLE suspicious_activities IS 'Rate-limit and fraud signals for beta abuse review.';
COMMENT ON TABLE manual_adjustments IS 'Admin-recorded beta finance placeholders.';
