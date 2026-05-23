export interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: 'buyer' | 'seller' | 'admin'
  created_at: string
  updated_at: string
  is_banned: boolean
}

export interface Profile {
  id: string
  user_id: string
  bio: string | null
  skills: string[] | null
  social_links: {
    twitter?: string
    instagram?: string
    website?: string
    linkedin?: string
  } | null
  profile_photo_url: string | null
  is_seller: boolean
  rating: number
  reviews_count: number
  created_at: string
  updated_at: string
}

export interface Listing {
  id: string
  seller_id: string
  title: string
  description: string
  category: string
  price_min: number
  price_max: number
  delivery_days: number
  images: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  created_at: string
}

export interface Conversation {
  id: string
  buyer_id: string
  seller_id: string
  listing_id: string | null
  status: 'active' | 'archived' | 'hired'
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

export interface Review {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  rating: number
  comment: string | null
  created_at: string
}

export type UserRole = 'buyer' | 'seller' | 'admin'
