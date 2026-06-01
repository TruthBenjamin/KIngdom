import Link from 'next/link'
import { ArrowLeft, BadgeCheck, MessageCircle, ShieldCheck, Star } from 'lucide-react'
import { ServiceCard } from '@/components/marketplace/service-card'
import { SellerStatusBadges } from '@/components/marketplace/seller-status-badges'
import { MobileFilterSheet } from '@/components/marketplace/mobile-filter-sheet'
import { createPublicServerClient } from '@/lib/supabase-public'
import {
  getFeaturedSellersForCategory,
  getMarketplaceCategories,
  MarketplaceSearchParams,
  searchMarketplaceServicePage,
} from '@/domains/marketplace'

export const dynamic = 'force-dynamic'

type CategoryPageProps = {
  params: { category: string }
  searchParams?: {
    sort?: MarketplaceSearchParams['sort']
    min?: string
    max?: string
    page?: string
  }
}

function hrefFor(category: string, next: Record<string, string | undefined>) {
  const params = new URLSearchParams()
  Object.entries(next).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })

  const query = params.toString()
  return query ? `/marketplace/${category}?${query}` : `/marketplace/${category}`
}

function titleFromSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default async function MarketplaceCategoryPage({ params, searchParams }: CategoryPageProps) {
  const supabase = createPublicServerClient()
  const sort = searchParams?.sort || 'featured'
  const page = Math.max(Number(searchParams?.page || '1') || 1, 1)
  const limit = 24
  const offset = (page - 1) * limit
  const [categories, servicePage, featured] = await Promise.all([
    getMarketplaceCategories(supabase),
    searchMarketplaceServicePage(supabase, {
      category: params.category,
      sort,
      minPrice: searchParams?.min ? Number(searchParams.min) : undefined,
      maxPrice: searchParams?.max ? Number(searchParams.max) : undefined,
      limit,
      offset,
    }),
    getFeaturedSellersForCategory(supabase, params.category, 4),
  ])
  const services = servicePage.services
  const totalPages = Math.max(Math.ceil(servicePage.totalCount / servicePage.limit), 1)

  const category = categories.find((item) => item.slug === params.category)
  const categoryName = category?.name || titleFromSlug(params.category) || 'Marketplace'
  const categoryDescription =
    category?.description ||
    'This category is not in the current taxonomy yet. Browse matching live services below or return to all marketplace services.'

  return (
    <div className='min-h-screen bg-white px-3 py-4 sm:px-6 sm:py-8 content-fade-in'>
      <div className='mx-auto max-w-[1400px]'>
        <Link href='/marketplace' className='mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#8a5a18]'>
          <ArrowLeft className='h-4 w-4' />
          All categories
        </Link>

        <header className='mb-6 rounded-lg border border-[#eadfce] bg-white p-5 sm:p-7'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
            <div>
              <p className='text-sm font-bold text-[#a36d1b]'>{category?.icon || 'Category'}</p>
              <h1 className='mt-2 text-3xl font-extrabold text-[#101828] sm:text-4xl'>{categoryName}</h1>
              <p className='mt-2 max-w-2xl text-sm leading-6 text-[#667085]'>{categoryDescription}</p>
              {!category && (
                <Link href='/marketplace' className='mt-4 inline-flex rounded-lg bg-[#101828] px-4 py-2 text-xs font-bold text-white'>
                  Browse all services
                </Link>
              )}
            </div>
            <div className='flex flex-wrap gap-2'>
              {[
                ['featured', 'Featured'],
                ['newest', 'Newest'],
                ['top_rated', 'Top rated'],
                ['price_low', 'Price low'],
              ].map(([value, label]) => (
                <Link
                  key={value}
                  href={hrefFor(params.category, { sort: value, min: searchParams?.min, max: searchParams?.max })}
                  className={`rounded-lg px-4 py-2 text-xs font-bold ${
                    sort === value ? 'bg-[#101828] text-white' : 'border border-[#eadfce] bg-white text-[#667085] hover:text-[#101828]'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </header>

        <section className='mb-6 grid gap-3 rounded-lg border border-[#eadfce] bg-[#fffdf8] p-3 sm:grid-cols-3'>
          {[
            [BadgeCheck, 'Category-fit sellers', 'Review profiles, samples, and seller status before choosing.'],
            [MessageCircle, 'Scope before booking', 'Ask about source files, handoff, and ministry-specific details.'],
            [ShieldCheck, 'Order history stays connected', 'Checkout links messages, delivery, revisions, and review prompts.'],
          ].map(([Icon, title, body]) => (
            <div key={title as string} className='flex gap-3 rounded-md bg-white p-3'>
              <Icon className='mt-0.5 h-4 w-4 shrink-0 text-[#8a5a18]' />
              <div>
                <p className='text-xs font-extrabold text-[#101828]'>{title as string}</p>
                <p className='mt-1 text-[11px] leading-5 text-[#667085]'>{body as string}</p>
              </div>
            </div>
          ))}
        </section>

        {!!featured.length && (
          <section className='mb-6 rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
            <div className='mb-4 flex items-center justify-between gap-3'>
              <h2 className='font-extrabold'>Featured sellers in {categoryName}</h2>
              <Star className='h-5 w-5 fill-[#d8952f] text-[#d8952f]' />
            </div>
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              {featured.map((service) => (
                <Link key={service.id} href={`/listing/${service.slug}`} className='rounded-lg bg-white p-4 transition hover:shadow-sm'>
                  <p className='truncate text-sm font-extrabold'>{service.seller.fullName}</p>
                  <p className='mt-1 truncate text-xs text-[#667085]'>{service.seller.headline || service.title}</p>
                  <SellerStatusBadges seller={service.seller} compact className='mt-3' />
                  {!service.seller.reviewsCount && service.seller.verificationStatus !== 'verified' ? null : (
                    <p className='mt-2 text-xs font-bold text-[#8a5a18]'>{service.seller.rating ? `${service.seller.rating.toFixed(1)} rating` : 'No ratings yet'}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className='mb-5 flex flex-wrap items-center gap-2'>
          <Link href={hrefFor(params.category, { sort, max: '100' })} className='rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#667085]'>Under $100</Link>
          <Link href={hrefFor(params.category, { sort, min: '100', max: '300' })} className='rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#667085]'>$100 - $300</Link>
          <Link href={hrefFor(params.category, { sort, min: '300' })} className='rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#667085]'>$300+</Link>
          <div className='ml-auto'>
            <MobileFilterSheet
              categories={categories}
              category={params.category}
              sort={sort}
              min={searchParams?.min}
              max={searchParams?.max}
              baseCategory={params.category}
            />
          </div>
        </div>

        {services.length ? (
          <>
            <div className='mb-4 flex items-center justify-between text-xs font-bold text-[#667085]'>
              <span>
                Showing {servicePage.offset + 1}-{servicePage.offset + services.length} of {servicePage.totalCount} services
              </span>
              <span>Page {page} of {totalPages}</span>
            </div>
            <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className='mt-8 flex items-center justify-center gap-2'>
                <Link
                  href={hrefFor(params.category, {
                    sort,
                    min: searchParams?.min,
                    max: searchParams?.max,
                    page: page > 1 ? String(page - 1) : undefined,
                  })}
                  className={`rounded-lg px-4 py-2 text-sm font-bold ${
                    page <= 1 ? 'pointer-events-none bg-white text-[#98a2b3]' : 'bg-[#101828] text-white'
                  }`}
                >
                  Previous
                </Link>
                <Link
                  href={hrefFor(params.category, {
                    sort,
                    min: searchParams?.min,
                    max: searchParams?.max,
                    page: page < totalPages ? String(page + 1) : String(page),
                  })}
                  className={`rounded-lg px-4 py-2 text-sm font-bold ${
                    page >= totalPages ? 'pointer-events-none bg-white text-[#98a2b3]' : 'bg-[#101828] text-white'
                  }`}
                >
                  Next
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className='grid min-h-[320px] place-items-center rounded-lg border border-dashed border-[#d8c9b5] bg-white p-8 text-center'>
            <div>
              <h2 className='text-xl font-extrabold'>No {categoryName.toLowerCase()} services yet</h2>
              <p className='mt-2 text-sm text-[#667085]'>Published seller services in this category will appear here automatically.</p>
              <Link href='/marketplace' className='mt-5 inline-flex rounded-lg bg-[#101828] px-4 py-2 text-sm font-bold text-white'>
                Browse all services
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
