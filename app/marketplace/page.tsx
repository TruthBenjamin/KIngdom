'use client'

import { useState } from 'react'
import type { ElementType } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Bell,
  CheckCircle2,
  Heart,
  Search,
  SlidersHorizontal,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const categories = [
  'All Categories',
  'Graphic Design',
  'Video Editing',
  'Music Production',
  'Church Media',
  'Website Development',
  'Writing',
  'Photography',
  'Social Media',
  'Event Planning',
  'Coaching & Consulting',
  'AI Services',
]

const listings = [
  {
    id: 'christian-flyer',
    title: 'I will design a stunning Christian flyer',
    creator: 'Grace Designs',
    rating: 4.9,
    reviews: 120,
    price: 50,
    category: 'Graphic Design',
    image:
      'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=760&h=760&fit=crop',
  },
  {
    id: 'sermon-edit',
    title: 'I will edit your sermon or event video',
    creator: 'Visuals by Mark',
    rating: 5.0,
    reviews: 18,
    price: 150,
    category: 'Video Editing',
    image:
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=760&h=760&fit=crop',
  },
  {
    id: 'worship-instrumental',
    title: 'I will produce worship instrumentals',
    creator: 'Kingdom Sounds',
    rating: 4.8,
    reviews: 76,
    price: 100,
    category: 'Music Production',
    image:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=760&h=760&fit=crop',
  },
  {
    id: 'church-site',
    title: 'I will create a modern church website',
    creator: 'WebFaith Studio',
    rating: 4.9,
    reviews: 106,
    price: 200,
    category: 'Website Development',
    image:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=760&h=760&fit=crop',
  },
  {
    id: 'faith-blog',
    title: 'I will write faith-based blog content',
    creator: 'Graceful Pen',
    rating: 4.8,
    reviews: 54,
    price: 75,
    category: 'Writing',
    image:
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=760&h=760&fit=crop',
  },
  {
    id: 'brand-identity',
    title: 'I will design your brand identity',
    creator: 'Purpose Brand Co.',
    rating: 4.9,
    reviews: 88,
    price: 250,
    category: 'Graphic Design',
    image:
      'https://images.unsplash.com/photo-1635405074683-96d6921a2a68?w=760&h=760&fit=crop',
  },
]

const MotionDiv = motion.div as ElementType

export default function Marketplace() {
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [search, setSearch] = useState('')

  const filteredListings = listings.filter((listing) => {
    const matchesCategory =
      selectedCategory === 'All Categories' || listing.category === selectedCategory
    const searchText = `${listing.title} ${listing.creator} ${listing.category}`.toLowerCase()
    return matchesCategory && searchText.includes(search.toLowerCase())
  })

  return (
    <div className='min-h-screen bg-[#f7f3ec]'>
      <div className='mx-auto grid max-w-[1500px] gap-0 px-3 py-3 lg:grid-cols-[250px_1fr_360px]'>
        <aside className='hidden border-r border-[#eadfce] bg-[#fffdf8] p-6 lg:block'>
          <h2 className='mb-4 text-sm font-bold'>Categories</h2>
          <div className='space-y-1'>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                  selectedCategory === category
                    ? 'bg-[#f2eadc] text-[#101828]'
                    : 'text-[#4b5563] hover:bg-[#fbf7f0]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className='mt-8 border-t border-[#eadfce] pt-6'>
            <h2 className='mb-4 text-sm font-bold'>Filters</h2>
            <div className='space-y-5'>
              <div>
                <div className='mb-2 flex items-center justify-between text-xs font-semibold'>
                  <span>Price Range</span>
                  <span>$500+</span>
                </div>
                <div className='h-1.5 rounded-full bg-[#eadfce]'>
                  <div className='h-full w-4/5 rounded-full bg-[#d8952f]' />
                </div>
              </div>
              <div>
                <p className='mb-3 text-xs font-semibold'>Delivery Time</p>
                {['Up to 24 hours', 'Up to 3 days', 'Up to 7 days', 'Anytime'].map((item) => (
                  <label key={item} className='mb-2 flex items-center gap-2 text-xs text-[#5b6472]'>
                    <input type='checkbox' className='rounded border-[#d8c9b5]' />
                    {item}
                  </label>
                ))}
              </div>
              <div>
                <p className='mb-3 text-xs font-semibold'>Seller Level</p>
                {['Top Rated', 'Verified Sellers'].map((item) => (
                  <label key={item} className='mb-2 flex items-center gap-2 text-xs text-[#5b6472]'>
                    <input type='checkbox' className='rounded border-[#d8c9b5]' />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className='bg-white p-5 sm:p-8'>
          <div className='mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between'>
            <div>
              <h1 className='text-2xl font-extrabold'>Find the perfect service</h1>
              <p className='mt-1 text-sm text-[#667085]'>
                Discover talented Christian creatives and professionals.
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <div className='relative min-w-0 flex-1 xl:w-96'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]' />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder='Search services, skills, or keywords...'
                  className='h-11 rounded-lg border-[#eadfce] bg-[#fffdf8] pl-9'
                />
              </div>
              <Button variant='outline' size='icon' className='border-[#eadfce] bg-[#fffdf8]'>
                <Bell className='h-4 w-4' />
              </Button>
            </div>
          </div>

          <div className='mb-6 flex flex-wrap items-center gap-2'>
            {['Popular', 'Newest', 'Top Rated'].map((tab, index) => (
              <button
                key={tab}
                className={`rounded-lg px-4 py-2 text-xs font-bold ${
                  index === 0 ? 'bg-[#101828] text-white' : 'bg-[#f7f3ec] text-[#667085]'
                }`}
              >
                {tab}
              </button>
            ))}
            <Button variant='outline' size='sm' className='ml-auto border-[#eadfce] bg-[#fffdf8] lg:hidden'>
              <SlidersHorizontal className='mr-2 h-4 w-4' />
              Filters
            </Button>
          </div>

          <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
            {filteredListings.map((listing, index) => (
              <MotionDiv
                key={listing.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <Link
                  href={`/listing/${listing.id}`}
                  className='group block overflow-hidden rounded-lg border border-[#eadfce] bg-[#fffdf8] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(33,24,10,0.12)]'
                >
                  <div className='relative aspect-[1.05] overflow-hidden bg-[#f2eadc]'>
                    <Image
                      src={listing.image}
                      alt={listing.title}
                      fill
                      sizes='(min-width: 1280px) 280px, (min-width: 768px) 45vw, 100vw'
                      className='object-cover transition duration-500 group-hover:scale-105'
                    />
                  </div>
                  <div className='p-4'>
                    <p className='line-clamp-2 min-h-[42px] text-sm font-extrabold leading-5'>
                      {listing.title}
                    </p>
                    <p className='mt-2 text-xs text-[#667085]'>{listing.creator}</p>
                    <div className='mt-3 flex items-center gap-1 text-xs'>
                      <Star className='h-3.5 w-3.5 fill-[#d8952f] text-[#d8952f]' />
                      <span className='font-bold'>{listing.rating.toFixed(1)}</span>
                      <span className='text-[#98a2b3]'>({listing.reviews})</span>
                    </div>
                    <div className='mt-4 flex items-center justify-between'>
                      <p className='text-sm font-extrabold'>From ${listing.price}</p>
                      <Heart className='h-4 w-4 text-[#98a2b3]' />
                    </div>
                  </div>
                </Link>
              </MotionDiv>
            ))}
          </div>
        </main>

        <aside className='hidden border-l border-[#eadfce] bg-[#fffdf8] p-6 xl:block'>
          <div className='overflow-hidden rounded-lg bg-[#101828]'>
            <div className='relative h-28 w-full'>
            <Image
              src='https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=900&h=360&fit=crop'
              alt='Video editing studio'
              fill
              sizes='360px'
              className='object-cover opacity-70'
            />
            </div>
          </div>
          <div className='-mt-10 px-5'>
            <Image
              src='https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=220&h=220&fit=crop'
              alt='Visuals by Mark'
              width={96}
              height={96}
              sizes='96px'
              className='h-24 w-24 rounded-full border-4 border-[#fffdf8] object-cover'
            />
          </div>
          <div className='px-5 pt-4'>
            <div className='flex items-center gap-2'>
              <h2 className='text-2xl font-extrabold'>Visuals by Mark</h2>
              <CheckCircle2 className='h-5 w-5 fill-[#2563eb] text-white' />
            </div>
            <p className='mt-2 text-sm text-[#667085]'>Video Editor & Filmmaker</p>
            <p className='mt-1 text-xs text-[#667085]'>Lagos, Nigeria</p>
            <div className='mt-3 flex items-center gap-1 text-sm'>
              <Star className='h-4 w-4 fill-[#d8952f] text-[#d8952f]' />
              <span className='font-bold'>5.0</span>
              <span className='text-[#667085]'>(98 reviews)</span>
            </div>
            <div className='mt-5 grid grid-cols-2 gap-3'>
              <Button variant='outline' className='border-[#eadfce] bg-white'>
                Message
              </Button>
              <Button className='bg-[#d8952f] text-[#101828] hover:bg-[#c88728]'>
                Hire Me
              </Button>
            </div>
            <div className='my-6 grid grid-cols-3 gap-3 border-y border-[#eadfce] py-5 text-center'>
              {[
                ['120+', 'Projects'],
                ['1 hour', 'Response'],
                ['98%', 'On time'],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className='font-extrabold'>{value}</p>
                  <p className='mt-1 text-[10px] text-[#667085]'>{label}</p>
                </div>
              ))}
            </div>
            <h3 className='font-bold'>About Me</h3>
            <p className='mt-2 text-sm leading-6 text-[#5b6472]'>
              I help churches, ministries, and Christian creators tell powerful
              stories through impactful visuals.
            </p>
            <h3 className='mt-6 font-bold'>Skills</h3>
            <div className='mt-3 flex flex-wrap gap-2'>
              {['Video Editing', 'Color Grading', 'Motion Graphics', 'Sermon Editing', 'Event Videos'].map((skill) => (
                <span key={skill} className='rounded-lg bg-[#f2eadc] px-3 py-2 text-xs font-medium'>
                  {skill}
                </span>
              ))}
            </div>
            <div className='mt-6 flex items-center justify-between'>
              <h3 className='font-bold'>Portfolio</h3>
              <button className='text-xs font-bold text-[#8a5a18]'>View all</button>
            </div>
            <div className='mt-3 grid grid-cols-3 gap-2'>
              {listings.slice(1, 4).map((listing) => (
                <Image
                  key={listing.id}
                  src={listing.image}
                  alt=''
                  width={96}
                  height={96}
                  sizes='96px'
                  className='aspect-square rounded-lg object-cover'
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
