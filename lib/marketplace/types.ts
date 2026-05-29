export type ServiceStatus = 'draft' | 'active' | 'paused' | 'rejected'

export type MarketplaceSearchParams = {
  query?: string
  category?: string
  sort?: 'popular' | 'newest' | 'top_rated' | 'featured' | 'price_low' | 'price_high'
  minPrice?: number
  maxPrice?: number
  limit?: number
  offset?: number
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
  sellerId: string
  title: string
  slug: string
  description: string
  category: string
  categorySlug: string
  price: number
  deliveryDays: number
  revisionCount: number
  requirements: string | null
  mediaUrl: string | null
  portfolioUrls: string[]
  packageSummary: string | null
  cancellationPolicy: string
  qualityScore: number
  moderationStatus: 'draft' | 'pending_review' | 'active' | 'paused' | 'rejected' | 'archived'
  tags: string[]
  isFeatured: boolean
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

export type MarketplaceSearchResult = {
  services: MarketplaceService[]
  totalCount: number
  limit: number
  offset: number
}
