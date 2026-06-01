import Link from 'next/link'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ServiceCard } from '@/components/marketplace/service-card'
import { MobileFilterSheet } from '@/components/marketplace/mobile-filter-sheet'
import { createPublicServerClient } from '@/lib/supabase-public'
import { getMarketplaceCategories, MarketplaceSearchParams, searchMarketplaceServicePage } from '@/domains/marketplace'

export const dynamic = 'force-dynamic'

type MarketplacePageProps = {
  searchParams?: {
    q?: string
    category?: string
    sort?: MarketplaceSearchParams['sort']
    min?: string
    max?: string
    page?: string
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
  const page = Math.max(Number(searchParams?.page || '1') || 1, 1)
  const limit = 24
  const offset = (page - 1) * limit

  const [categories, servicePage] = await Promise.all([
    getMarketplaceCategories(supabase),
    searchMarketplaceServicePage(supabase, {
      query,
      category: selectedCategory,
      sort,
      minPrice: searchParams?.min ? Number(searchParams.min) : undefined,
      maxPrice: searchParams?.max ? Number(searchParams.max) : undefined,
      limit,
      offset,
    }),
  ])
  const services = servicePage.services
  const totalPages = Math.max(Math.ceil(servicePage.totalCount / servicePage.limit), 1)

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
              <h1 className='text-2xl font-extrabold tracking-tight sm:text-3xl'>Find the perfect service</h1>
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

          {services.length ? (
            <>
              <div className='mb-4 flex items-center justify-between text-xs font-bold text-[#667085]'>
                <span>
                  Showing {servicePage.offset + 1}-{servicePage.offset + services.length} of {servicePage.totalCount} ranked services
                </span>
                <span>Page {page} of {totalPages}</span>
              </div>
              <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
                {services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className='mt-8 flex items-center justify-center gap-2'>
                  <Link
                    href={hrefFor({
                      q: query,
                      category: selectedCategory,
                      sort,
                      min: searchParams?.min,
                      max: searchParams?.max,
                      page: page > 1 ? String(page - 1) : undefined,
                    })}
                    className={`rounded-lg px-4 py-2 text-sm font-bold ${
                      page <= 1 ? 'pointer-events-none bg-[#f7f3ec] text-[#98a2b3]' : 'bg-[#101828] text-white'
                    }`}
                  >
                    Previous
                  </Link>
                  <Link
                    href={hrefFor({
                      q: query,
                      category: selectedCategory,
                      sort,
                      min: searchParams?.min,
                      max: searchParams?.max,
                      page: page < totalPages ? String(page + 1) : String(page),
                    })}
                    className={`rounded-lg px-4 py-2 text-sm font-bold ${
                      page >= totalPages ? 'pointer-events-none bg-[#f7f3ec] text-[#98a2b3]' : 'bg-[#101828] text-white'
                    }`}
                  >
                    Next
                  </Link>
                </div>
              )}
            </>
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

        <aside className='hidden border-l border-[#eadfce] bg-[#fffdf8] p-6 xl:block' />
      </div>
    </div>
  )
}
