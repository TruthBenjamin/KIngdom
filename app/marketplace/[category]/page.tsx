import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Star } from 'lucide-react'
import { ServiceCard } from '@/components/marketplace/service-card'
import { MobileFilterSheet } from '@/components/marketplace/mobile-filter-sheet'
import { createPublicServerClient } from '@/lib/supabase-public'
import {
  getFeaturedSellersForCategory,
  getMarketplaceCategories,
  searchMarketplaceServices,
} from '@/lib/marketplace/queries'
import { MarketplaceSearchParams } from '@/lib/marketplace/types'

export const dynamic = 'force-dynamic'

type CategoryPageProps = {
  params: { category: string }
  searchParams?: {
    sort?: MarketplaceSearchParams['sort']
    min?: string
    max?: string
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

export default async function MarketplaceCategoryPage({ params, searchParams }: CategoryPageProps) {
  const supabase = createPublicServerClient()
  const sort = searchParams?.sort || 'featured'
  const [categories, services, featured] = await Promise.all([
    getMarketplaceCategories(supabase),
    searchMarketplaceServices(supabase, {
      category: params.category,
      sort,
      minPrice: searchParams?.min ? Number(searchParams.min) : undefined,
      maxPrice: searchParams?.max ? Number(searchParams.max) : undefined,
      limit: 24,
    }),
    getFeaturedSellersForCategory(supabase, params.category, 4),
  ])

  const category = categories.find((item) => item.slug === params.category)
  if (!category) notFound()

  return (
    <div className='min-h-screen bg-[#f7f3ec] px-3 py-4 sm:px-6 sm:py-8 content-fade-in'>
      <div className='mx-auto max-w-[1400px]'>
        <Link href='/marketplace' className='mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#8a5a18]'>
          <ArrowLeft className='h-4 w-4' />
          All categories
        </Link>

        <header className='mb-6 rounded-lg border border-[#eadfce] bg-white p-5 sm:p-7'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
            <div>
              <p className='text-sm font-bold text-[#a36d1b]'>{category.icon || 'Category'}</p>
              <h1 className='mt-2 text-3xl font-extrabold text-[#101828] sm:text-4xl'>{category.name}</h1>
              <p className='mt-2 max-w-2xl text-sm leading-6 text-[#667085]'>
                {category.description || 'Browse category-specific services backed by marketplace profiles, reviews, messages, and order tracking.'}
              </p>
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
                  href={hrefFor(params.category, { sort: value })}
                  className={`rounded-lg px-4 py-2 text-xs font-bold ${
                    sort === value ? 'bg-[#101828] text-white' : 'bg-[#f7f3ec] text-[#667085]'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </header>

        <section className='mb-6 grid gap-3 sm:grid-cols-3'>
          {[
            ['Category fit', `Every result is tagged under ${category.name} for faster shortlisting.`],
            ['Seller context', 'Featured sellers are ranked by rating, profile depth, and active services.'],
            ['Scoped buying', 'Use price and delivery filters before opening a conversation.'],
          ].map(([title, body]) => (
            <div key={title} className='rounded-lg border border-[#eadfce] bg-white p-4'>
              <CheckCircle2 className='h-5 w-5 text-[#15803d]' />
              <p className='mt-3 text-sm font-extrabold'>{title}</p>
              <p className='mt-1 text-xs leading-5 text-[#667085]'>{body}</p>
            </div>
          ))}
        </section>

        {!!featured.length && (
          <section className='mb-6 rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
            <div className='mb-4 flex items-center justify-between gap-3'>
              <h2 className='font-extrabold'>Featured sellers in {category.name}</h2>
              <Star className='h-5 w-5 fill-[#d8952f] text-[#d8952f]' />
            </div>
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              {featured.map((service) => (
                <Link key={service.id} href={`/listing/${service.slug}`} className='rounded-lg bg-white p-4 transition hover:shadow-sm'>
                  <p className='truncate text-sm font-extrabold'>{service.seller.fullName}</p>
                  <p className='mt-1 truncate text-xs text-[#667085]'>{service.seller.headline || service.title}</p>
                  <p className='mt-3 text-xs font-bold text-[#8a5a18]'>{service.seller.rating ? `${service.seller.rating.toFixed(1)} rating` : 'New seller'}</p>
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
          <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className='grid min-h-[320px] place-items-center rounded-lg border border-dashed border-[#d8c9b5] bg-white p-8 text-center'>
            <div>
              <h2 className='text-xl font-extrabold'>No {category.name.toLowerCase()} services yet</h2>
              <p className='mt-2 text-sm text-[#667085]'>Published seller services in this category will appear here automatically.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
