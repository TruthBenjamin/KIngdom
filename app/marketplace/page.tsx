import Link from 'next/link'
import { CheckCircle2, Search, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ServiceCard } from '@/components/marketplace/service-card'
import { MobileFilterSheet } from '@/components/marketplace/mobile-filter-sheet'
import { createPublicServerClient } from '@/lib/supabase-public'
import { getMarketplaceCategories, searchMarketplaceServices } from '@/lib/marketplace/queries'
import { MarketplaceSearchParams } from '@/lib/marketplace/types'

export const dynamic = 'force-dynamic'

type MarketplacePageProps = {
  searchParams?: {
    q?: string
    category?: string
    sort?: MarketplaceSearchParams['sort']
    min?: string
    max?: string
  }
}

function hrefFor(next: Record<string, string | undefined>) {
  const params = new URLSearchParams()
  Object.entries(next).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })

  const query = params.toString()
  return query ? `/marketplace?${query}` : '/marketplace'
}

export default async function Marketplace({ searchParams }: MarketplacePageProps) {
  const supabase = createPublicServerClient()
  const selectedCategory = searchParams?.category || 'all'
  const sort = searchParams?.sort || 'popular'
  const query = searchParams?.q || ''

  const [categories, services] = await Promise.all([
    getMarketplaceCategories(supabase),
    searchMarketplaceServices(supabase, {
      query,
      category: selectedCategory,
      sort,
      minPrice: searchParams?.min ? Number(searchParams.min) : undefined,
      maxPrice: searchParams?.max ? Number(searchParams.max) : undefined,
      limit: 24,
    }),
  ])

  return (
    <div className='min-h-screen bg-[#f7f3ec] content-fade-in'>
      <div className='mx-auto grid max-w-[1500px] gap-0 px-3 py-3 lg:grid-cols-[250px_1fr] xl:grid-cols-[250px_1fr_330px]'>
        <aside className='hidden border-r border-[#eadfce] bg-[#fffdf8] p-6 lg:block'>
          <h2 className='mb-4 text-sm font-bold'>Categories</h2>
          <div className='space-y-1'>
            <Link
              href={hrefFor({ q: query, sort, category: undefined })}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                selectedCategory === 'all' ? 'bg-[#f2eadc] text-[#101828]' : 'text-[#4b5563] hover:bg-[#fbf7f0]'
              }`}
            >
              All Categories
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/marketplace/${category.slug}${sort ? `?sort=${sort}` : ''}`}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                  selectedCategory === category.slug
                    ? 'bg-[#f2eadc] text-[#101828]'
                    : 'text-[#4b5563] hover:bg-[#fbf7f0]'
                }`}
              >
                {category.name}
              </Link>
            ))}
          </div>

          <div className='mt-8 border-t border-[#eadfce] pt-6'>
            <h2 className='mb-4 text-sm font-bold'>Filters</h2>
            <div className='space-y-2 text-xs text-[#5b6472]'>
              <Link href={hrefFor({ q: query, category: selectedCategory, sort, max: '100' })} className='block rounded-lg bg-white px-3 py-2 font-semibold'>
                Under $100
              </Link>
              <Link href={hrefFor({ q: query, category: selectedCategory, sort, min: '100', max: '300' })} className='block rounded-lg bg-white px-3 py-2 font-semibold'>
                $100 - $300
              </Link>
              <Link href={hrefFor({ q: query, category: selectedCategory, sort, min: '300' })} className='block rounded-lg bg-white px-3 py-2 font-semibold'>
                $300+
              </Link>
            </div>
          </div>
        </aside>

        <main className='bg-white p-5 sm:p-8'>
          <div className='mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between'>
            <div>
              <div className='mb-2 inline-flex items-center gap-2 rounded-full border border-[#eadfce] bg-[#fffdf8] px-3 py-1 text-xs font-bold text-[#8a5a18]'>
                <Sparkles className='h-3.5 w-3.5' />
                Clear service scopes, creator profiles, and order tracking
              </div>
              <h1 className='text-2xl font-extrabold tracking-tight sm:text-3xl'>Find the perfect service</h1>
              <p className='mt-1 text-sm text-[#667085]'>
                Discover Christian creatives and professionals with real profiles, services, and order paths.
              </p>
            </div>
            <form action='/marketplace' className='flex items-center gap-2'>
              <input type='hidden' name='category' value={selectedCategory === 'all' ? '' : selectedCategory} />
              <input type='hidden' name='sort' value={sort} />
              <div className='relative min-w-0 flex-1 xl:w-96'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]' />
                <input
                  name='q'
                  defaultValue={query}
                  placeholder='Search services, skills, or keywords...'
                  className='h-11 w-full rounded-lg border border-[#eadfce] bg-[#fffdf8] pl-9 pr-3 text-sm outline-none ring-[#d8952f] focus:ring-2'
                />
              </div>
            </form>
          </div>

          <div className='mb-6 flex flex-wrap items-center gap-2'>
            {[
              ['popular', 'Popular'],
              ['newest', 'Newest'],
              ['top_rated', 'Top rated'],
              ['featured', 'Featured'],
              ['price_low', 'Price low'],
              ['price_high', 'Price high'],
            ].map(([value, label]) => (
              <Link
                key={value}
                href={hrefFor({ q: query, category: selectedCategory, sort: value })}
                className={`rounded-lg px-4 py-2 text-xs font-bold ${
                  sort === value ? 'bg-[#101828] text-white' : 'bg-[#f7f3ec] text-[#667085]'
                }`}
              >
                {label}
              </Link>
            ))}
            <div className='ml-auto'>
              <MobileFilterSheet
                categories={categories}
                query={query}
                category={selectedCategory}
                sort={sort}
                min={searchParams?.min}
                max={searchParams?.max}
              />
            </div>
          </div>

          <div className='mb-6 grid gap-3 rounded-lg border border-[#eadfce] bg-[#fffdf8] p-4 text-sm text-[#5b6472] sm:grid-cols-3'>
            {[
              'Seller profiles include response time and profile status',
              'Message before booking or create a protected marketplace workflow',
              'Saved services sync to your buyer dashboard',
            ].map((item) => (
              <div key={item} className='flex items-start gap-2'>
                <CheckCircle2 className='mt-0.5 h-4 w-4 shrink-0 text-[#15803d]' />
                <span>{item}</span>
              </div>
            ))}
          </div>

          {services.length ? (
            <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div className='grid min-h-[360px] place-items-center rounded-lg border border-dashed border-[#d8c9b5] bg-[#fffdf8] p-8 text-center'>
              <div>
                <Search className='mx-auto h-10 w-10 text-[#b97822]' />
                <h2 className='mt-4 text-xl font-extrabold'>No services found</h2>
                <p className='mt-2 max-w-md text-sm leading-6 text-[#667085]'>
                  Try a broader search or clear filters. When sellers publish services, they appear here automatically.
                </p>
                <Link href='/marketplace'>
                  <Button className='mt-5 bg-[#101828] text-white hover:bg-[#1f2937]'>Clear filters</Button>
                </Link>
              </div>
            </div>
          )}
        </main>

        <aside className='hidden border-l border-[#eadfce] bg-[#fffdf8] p-6 xl:block'>
          <div className='rounded-lg border border-[#eadfce] bg-white p-5'>
            <p className='text-sm font-bold text-[#8a5a18]'>Marketplace decisions</p>
            <h2 className='mt-2 text-2xl font-extrabold tracking-tight'>Built for clearer comparisons</h2>
            <div className='mt-5 space-y-4 text-sm leading-6 text-[#5b6472]'>
              {[
                ['Profile depth', 'Ratings, response time, profile status, and seller headline travel with each service.'],
                ['Cleaner decisions', 'Compare price, category, delivery time, revisions, and tags without leaving search.'],
                ['Real workflows', 'Save, message, book, deliver, revise, and complete orders from the same marketplace model.'],
              ].map(([title, body]) => (
                <div key={title} className='border-t border-[#eadfce] pt-4 first:border-0 first:pt-0'>
                  <p className='font-extrabold text-[#101828]'>{title}</p>
                  <p className='mt-1'>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
