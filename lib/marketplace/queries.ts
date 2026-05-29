import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { MarketplaceCategory, MarketplaceSearchParams, MarketplaceSearchResult, MarketplaceService } from './types'

const serviceSelect = `
  id,
  seller_id,
  title,
  slug,
  description,
  category,
  category_slug,
  price,
  delivery_days,
  revision_count,
  requirements,
  media_url,
  portfolio_urls,
  package_summary,
  cancellation_policy,
  quality_score,
  moderation_status,
  tags,
  is_featured,
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
  title: string
  slug: string | null
  description: string
  category: string | null
  category_slug: string | null
  price: number
  delivery_days: number | null
  revision_count: number | null
  requirements: string | null
  media_url: string | null
  portfolio_urls: string[] | null
  package_summary: string | null
  cancellation_policy: string | null
  quality_score: number | null
  moderation_status: 'draft' | 'pending_review' | 'active' | 'paused' | 'rejected' | 'archived' | null
  tags: string[] | null
  is_featured: boolean | null
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

type SearchRankRow = {
  service_id: string
  ranking_score: number | string | null
  total_count: number | string | null
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
    sellerId: row.seller_id,
    title: row.title,
    slug: row.slug || row.id,
    description: row.description,
    category: row.category || 'General',
    categorySlug: row.category_slug || 'general',
    price: row.price,
    deliveryDays: row.delivery_days || 3,
    revisionCount: row.revision_count || 1,
    requirements: row.requirements,
    mediaUrl: row.media_url,
    portfolioUrls: row.portfolio_urls || [],
    packageSummary: row.package_summary,
    cancellationPolicy: row.cancellation_policy || 'Buyer may request cancellation before work begins. Active orders require seller/admin review.',
    qualityScore: Number(row.quality_score || 0),
    moderationStatus: row.moderation_status || 'active',
    tags: row.tags || [],
    isFeatured: Boolean(row.is_featured),
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
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error(error)
    return []
  }

  return (data || []) as MarketplaceCategory[]
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function searchMarketplaceServices(
  supabase: SupabaseClient<Database>,
  params: MarketplaceSearchParams = {}
): Promise<MarketplaceService[]> {
  const result = await searchMarketplaceServicePage(supabase, params)
  return result.services
}

export async function searchMarketplaceServicePage(
  supabase: SupabaseClient<Database>,
  params: MarketplaceSearchParams = {}
): Promise<MarketplaceSearchResult> {
  const limit = Math.min(Math.max(params.limit || 24, 1), 60)
  const offset = Math.max(params.offset || 0, 0)

  const { data: rankedRows, error: rankError } = await supabase.rpc('marketplace_search_services', {
    search_query: params.query?.trim() || null,
    target_category_slug: params.category && params.category !== 'all' ? params.category : null,
    min_price: typeof params.minPrice === 'number' ? params.minPrice : null,
    max_price: typeof params.maxPrice === 'number' ? params.maxPrice : null,
    result_sort: params.sort || 'popular',
    result_limit: limit,
    result_offset: offset,
  })

  if (!rankError && rankedRows) {
    const rows = rankedRows as SearchRankRow[]
    const ids = rows.map((row) => row.service_id).filter(Boolean)
    const totalCount = Number(rows[0]?.total_count || 0)

    if (!ids.length) {
      return { services: [], totalCount, limit, offset }
    }

    const { data, error } = await supabase
      .from('services')
      .select(serviceSelect)
      .in('id', ids)

    if (error) {
      console.error(error)
      return { services: [], totalCount: 0, limit, offset }
    }

    const byId = new Map(((data || []) as unknown as RawService[]).map((row) => [row.id, mapService(row)]))
    const services = ids.map((id) => byId.get(id)).filter((service): service is MarketplaceService => Boolean(service))

    return { services, totalCount, limit, offset }
  }

  if (rankError) {
    console.error(rankError)
  }

  let query = supabase
    .from('services')
    .select(serviceSelect)
    .eq('is_active', true)
    .eq('moderation_status', 'active')
    .range(offset, offset + limit - 1)

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
  else if (params.sort === 'featured') query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error(error)
    return { services: [], totalCount: 0, limit, offset }
  }

  const services = ((data || []) as unknown as RawService[]).map(mapService)

  if (params.sort === 'top_rated' || params.sort === 'popular') {
    const sorted = services.sort((a, b) => {
      const ratingDelta = b.seller.rating - a.seller.rating
      if (ratingDelta !== 0) return ratingDelta
      return b.seller.reviewsCount - a.seller.reviewsCount
    })
    return { services: sorted, totalCount: sorted.length, limit, offset }
  }

  return { services, totalCount: services.length, limit, offset }
}

export async function getMarketplaceServiceBySlug(
  supabase: SupabaseClient<Database>,
  slugOrId: string
): Promise<MarketplaceService | null> {
  let query = supabase
    .from('services')
    .select(serviceSelect)
    .eq('is_active', true)
    .eq('moderation_status', 'active')

  query = isUuid(slugOrId) ? query.or(`slug.eq.${slugOrId},id.eq.${slugOrId}`) : query.eq('slug', slugOrId)

  const { data, error } = await query.maybeSingle()

  if (error) {
    console.error(error)
    return null
  }

  return data ? mapService(data as unknown as RawService) : null
}

export async function getRelatedMarketplaceServices(
  supabase: SupabaseClient<Database>,
  service: MarketplaceService,
  limit = 6
): Promise<MarketplaceService[]> {
  const sameCategory = await searchMarketplaceServices(supabase, {
    category: service.categorySlug,
    sort: 'top_rated',
    limit: limit + 4,
  })

  const related = sameCategory.filter((item) => item.id !== service.id)

  if (related.length >= limit || !service.tags.length) {
    return related.slice(0, limit)
  }

  const { data, error } = await supabase
    .from('services')
    .select(serviceSelect)
    .eq('is_active', true)
    .eq('moderation_status', 'active')
    .overlaps('tags', service.tags)
    .neq('id', service.id)
    .limit(limit + 4)

  if (error) {
    console.error(error)
    return related.slice(0, limit)
  }

  const seen = new Set(related.map((item) => item.id))
  const tagged = ((data || []) as unknown as RawService[])
    .map(mapService)
    .filter((item) => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })

  return [...related, ...tagged].slice(0, limit)
}

export async function getFeaturedSellersForCategory(
  supabase: SupabaseClient<Database>,
  categorySlug: string,
  limit = 4
): Promise<MarketplaceService[]> {
  return searchMarketplaceServices(supabase, {
    category: categorySlug,
    sort: 'top_rated',
    limit,
  })
}

export async function getSavedMarketplaceServices(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<MarketplaceService[]> {
  const { data, error } = await supabase
    .from('saved_services')
    .select(`created_at, service:services(${serviceSelect})`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return []
  }

  return ((data || []) as unknown as { service: RawService | RawService[] | null }[])
    .map((row) => first(row.service))
    .filter((service): service is RawService => Boolean(service))
    .map(mapService)
}
