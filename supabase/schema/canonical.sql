-- Canonical schema snapshot for new Kingdom Marketplace environments.
-- This is the service-first target model. Historical upgrade files are retained
-- only to migrate existing demo databases into this shape.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin');
CREATE TYPE service_status AS ENUM ('draft', 'pending_review', 'active', 'paused', 'rejected', 'archived');
CREATE TYPE conversation_status AS ENUM ('active', 'archived', 'hired');
CREATE TYPE message_type AS ENUM ('TEXT', 'IMAGE', 'FILE', 'DELIVERABLE', 'SYSTEM');
CREATE TYPE message_status AS ENUM ('SENT', 'DELIVERED', 'READ');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'REFUNDED');
CREATE TYPE marketplace_order_status AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'DELIVERED', 'REVISION_REQUESTED', 'COMPLETED', 'CANCELLED', 'DISPUTED');
CREATE TYPE transaction_type AS ENUM ('PAYMENT', 'ESCROW_HOLD', 'RELEASE', 'WITHDRAWAL', 'REFUND', 'FEE');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');
CREATE TYPE withdrawal_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');
CREATE TYPE notification_type AS ENUM ('NEW_MESSAGE', 'ORDER_DELIVERY', 'REVISION_REQUEST', 'PAYMENT_CONFIRMATION');
CREATE TYPE review_status AS ENUM ('published', 'hidden', 'flagged');

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'buyer' NOT NULL,
  is_banned BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE profiles (
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

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE seller_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  headline TEXT,
  location TEXT,
  response_time_minutes INTEGER,
  verification_status TEXT DEFAULT 'unverified' NOT NULL CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  profile_completion_score INTEGER DEFAULT 0 NOT NULL CHECK (profile_completion_score BETWEEN 0 AND 100),
  is_accepting_orders BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE buyer_profiles (
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

CREATE TABLE services (
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
  tags TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  moderation_status service_status DEFAULT 'draft' NOT NULL,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE orders (
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
  due_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE conversations (
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

CREATE TABLE messages (
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

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  status review_status DEFAULT 'published' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX idx_services_search_vector ON services USING GIN(search_vector);
CREATE INDEX idx_services_category_status ON services(category_slug, moderation_status, is_active);
CREATE INDEX idx_services_seller_status ON services(seller_id, moderation_status, created_at DESC);
CREATE INDEX idx_orders_buyer_status ON orders(buyer_id, order_status, created_at DESC);
CREATE INDEX idx_orders_seller_status ON orders(seller_id, order_status, created_at DESC);
CREATE INDEX idx_orders_service_status ON orders(service_id, order_status, created_at DESC);
CREATE INDEX idx_conversations_service_id ON conversations(service_id);
CREATE INDEX idx_messages_conversation_created_at ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_reviews_service_status ON reviews(service_id, status, created_at DESC);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE services IS 'Canonical marketplace entity.';
COMMENT ON TABLE reviews IS 'Verified buyer reviews tied to completed orders and services.';
