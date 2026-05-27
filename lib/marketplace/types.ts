export type ServiceStatus = 'draft' | 'active' | 'paused' | 'rejected'

export type MarketplaceSearchParams = {
  query?: string
  category?: string
  sort?: 'popular' | 'newest' | 'price_low' | 'price_high'
  minPrice?: number
  maxPrice?: number
  limit?: number
}

export type SellerSummary = {
  id: string
  fullName: string
  avatarUrl: string | null
  role: 'buyer' | 'seller' | 'admin'
  rating: number
  reviewsCount: number
  headline: string | null
  location: string | null
  responseTimeMinutes: number | null
  verificationStatus: string
}

export type MarketplaceService = {
  id: string
  listingId: string | null
  sellerId: string
  title: string
  slug: string
  description: string
  category: string
  price: number
  deliveryDays: number
  revisionCount: number
  requirements: string | null
  mediaUrl: string | null
  isActive: boolean
  status: ServiceStatus
  createdAt: string
  seller: SellerSummary
}

export type MarketplaceCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
}
