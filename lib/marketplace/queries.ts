import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { MarketplaceCategory, MarketplaceSearchParams, MarketplaceService } from './types'

const serviceSelect = `
  id,
  seller_id,
  listing_id,
  title,
  slug,
  description,
  category,
  price,
  delivery_days,
  revision_count,
  requirements,
  media_url,
  is_active,
  status,
  created_at,
  seller:users!services_seller_id_fkey(
    id,
    full_name,
    avatar_url,
    role,
    profile:profiles(rating, reviews_count),
    seller_profile:seller_profiles(headline, location, response_time_minutes, verification_status)
  )
`

type RawService = {
  id: string
  seller_id: string
  listing_id: string | null
  title: string
  slug: string | null
  description: string
  category: string | null
  price: number
  delivery_days: number | null
  revision_count: number | null
  requirements: string | null
  media_url: string | null
  is_active: boolean
  status: 'draft' | 'active' | 'paused' | 'rejected' | null
  created_at: string
  seller:
    | {
        id: string
        full_name: string | null
        avatar_url: string | null
        role: 'buyer' | 'seller' | 'admin'
        profile?: { rating: number | null; reviews_count: number | null }[] | null
        seller_profile?:
          | {
              headline: string | null
              location: string | null
              response_time_minutes: number | null
              verification_status: string | null
            }[]
          | null
      }
    | null
}

function first<T>(value: T[] | T | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] || null : value
}

export function mapService(row: RawService): MarketplaceService {
  const profile = first(row.seller?.profile)
  const sellerProfile = first(row.seller?.seller_profile)

  return {
    id: row.id,
    listingId: row.listing_id,
    sellerId: row.seller_id,
    title: row.title,
    slug: row.slug || row.id,
    description: row.description,
    category: row.category || 'General',
    price: row.price,
    deliveryDays: row.delivery_days || 3,
    revisionCount: row.revision_count || 1,
    requirements: row.requirements,
    mediaUrl: row.media_url,
    isActive: row.is_active,
    status: row.status || 'active',
    createdAt: row.created_at,
    seller: {
      id: row.seller?.id || row.seller_id,
      fullName: row.seller?.full_name || 'Kingdom Creator',
      avatarUrl: row.seller?.avatar_url || null,
      role: row.seller?.role || 'seller',
      rating: Number(profile?.rating || 0),
      reviewsCount: Number(profile?.reviews_count || 0),
      headline: sellerProfile?.headline || null,
      location: sellerProfile?.location || null,
      responseTimeMinutes: sellerProfile?.response_time_minutes || null,
      verificationStatus: sellerProfile?.verification_status || 'unverified',
    },
  }
}

export async function getMarketplaceCategories(
  supabase: SupabaseClient<Database>
): Promise<MarketplaceCategory[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description, icon')
    .order('name', { ascending: true })

  if (error) {
    console.error(error)
    return []
  }

  return (data || []) as MarketplaceCategory[]
}

export async function searchMarketplaceServices(
  supabase: SupabaseClient<Database>,
  params: MarketplaceSearchParams = {}
): Promise<MarketplaceService[]> {
  let query = supabase
    .from('services')
    .select(serviceSelect)
    .eq('is_active', true)
    .eq('status', 'active')
    .limit(params.limit || 24)

  if (params.category && params.category !== 'all') {
    query = query.eq('category_slug', params.category)
  }

  if (params.query?.trim()) {
    query = query.or(`title.ilike.%${params.query.trim()}%,description.ilike.%${params.query.trim()}%,category.ilike.%${params.query.trim()}%`)
  }

  if (typeof params.minPrice === 'number') query = query.gte('price', params.minPrice)
  if (typeof params.maxPrice === 'number') query = query.lte('price', params.maxPrice)

  if (params.sort === 'price_low') query = query.order('price', { ascending: true })
  else if (params.sort === 'price_high') query = query.order('price', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error(error)
    return []
  }

  return ((data || []) as unknown as RawService[]).map(mapService)
}

export async function getMarketplaceServiceBySlug(
  supabase: SupabaseClient<Database>,
  slugOrId: string
): Promise<MarketplaceService | null> {
  const { data, error } = await supabase
    .from('services')
    .select(serviceSelect)
    .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error(error)
    return null
  }

  return data ? mapService(data as unknown as RawService) : null
}
