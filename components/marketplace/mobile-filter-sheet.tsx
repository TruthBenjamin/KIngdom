'use client'

import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarketplaceCategory, MarketplaceSearchParams } from '@/lib/marketplace/types'

type MobileFilterSheetProps = {
  categories: MarketplaceCategory[]
  query?: string
  category?: string
  sort?: MarketplaceSearchParams['sort']
  min?: string
  max?: string
  baseCategory?: string
}

const priceOptions = [
  { label: 'Any price', min: undefined, max: undefined },
  { label: 'Under $100', min: undefined, max: '100' },
  { label: '$100 - $300', min: '100', max: '300' },
  { label: '$300+', min: '300', max: undefined },
]

const sortOptions: { value: MarketplaceSearchParams['sort']; label: string }[] = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'top_rated', label: 'Top rated' },
  { value: 'featured', label: 'Featured' },
  { value: 'price_low', label: 'Price low' },
  { value: 'price_high', label: 'Price high' },
]

function buildHref(input: {
  query?: string
  category?: string
  sort?: string
  min?: string
  max?: string
  baseCategory?: string
}) {
  const params = new URLSearchParams()

  if (!input.baseCategory && input.query) params.set('q', input.query)
  const selectedCategory = input.baseCategory || input.category
  if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory)
  if (input.sort) params.set('sort', input.sort)
  if (input.min) params.set('min', input.min)
  if (input.max) params.set('max', input.max)

  const queryString = params.toString()
  return queryString ? `/marketplace?${queryString}` : '/marketplace'
}

export function MobileFilterSheet({
  categories,
  query = '',
  category = 'all',
  sort = 'popular',
  min,
  max,
  baseCategory,
}: MobileFilterSheetProps) {
  const [open, setOpen] = useState(false)
  const activeCategory = baseCategory || category

  return (
    <div className='lg:hidden'>
      <Button
        type='button'
        variant='outline'
        size='sm'
        className='border-[#eadfce] bg-[#fffdf8]'
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal className='mr-2 h-4 w-4' />
        Filters
      </Button>

      {open && (
        <div className='fixed inset-0 z-[80]'>
          <button
            className='absolute inset-0 bg-[#101828]/45'
            aria-label='Close filters'
            onClick={() => setOpen(false)}
          />
          <div className='absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-lg bg-white p-5 shadow-[0_-18px_60px_rgba(16,24,40,0.18)]'>
            <div className='mb-5 flex items-center justify-between gap-4'>
              <div>
                <h2 className='text-lg font-extrabold'>Filters</h2>
                <p className='mt-1 text-xs text-[#667085]'>Choose a category, price range, and sort order.</p>
              </div>
              <Button type='button' variant='ghost' size='icon' onClick={() => setOpen(false)} aria-label='Close filters'>
                <X className='h-5 w-5' />
              </Button>
            </div>

            {!baseCategory && (
              <section className='mb-5'>
                <h3 className='mb-2 text-xs font-bold uppercase text-[#667085]'>Category</h3>
                <div className='grid gap-2'>
                  <a
                    href={buildHref({ query, category: 'all', sort, min, max })}
                    className={`rounded-lg px-3 py-2 text-sm font-bold ${
                      activeCategory === 'all' ? 'bg-[#101828] text-white' : 'bg-white text-[#4b5563]'
                    }`}
                  >
                    All Categories
                  </a>
                  {categories.map((item) => (
                    <a
                      key={item.id}
                      href={buildHref({ query, category: item.slug, sort, min, max })}
                      className={`rounded-lg px-3 py-2 text-sm font-bold ${
                        activeCategory === item.slug ? 'bg-[#101828] text-white' : 'bg-white text-[#4b5563]'
                      }`}
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
              </section>
            )}

            <section className='mb-5'>
              <h3 className='mb-2 text-xs font-bold uppercase text-[#667085]'>Price</h3>
              <div className='grid grid-cols-2 gap-2'>
                {priceOptions.map((option) => (
                  <a
                    key={option.label}
                    href={buildHref({ query, category, sort, min: option.min, max: option.max, baseCategory })}
                    className={`rounded-lg px-3 py-2 text-sm font-bold ${
                      min === option.min && max === option.max ? 'bg-[#101828] text-white' : 'bg-white text-[#4b5563]'
                    }`}
                  >
                    {option.label}
                  </a>
                ))}
              </div>
            </section>

            <section>
              <h3 className='mb-2 text-xs font-bold uppercase text-[#667085]'>Sort</h3>
              <div className='grid grid-cols-2 gap-2'>
                {sortOptions.map((option) => (
                  <a
                    key={option.value}
                    href={buildHref({ query, category, sort: option.value, min, max, baseCategory })}
                    className={`rounded-lg px-3 py-2 text-sm font-bold ${
                      sort === option.value ? 'bg-[#101828] text-white' : 'bg-white text-[#4b5563]'
                    }`}
                  >
                    {option.label}
                  </a>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
