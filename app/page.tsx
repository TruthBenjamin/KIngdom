'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ComponentType } from 'react'
import {
  BadgeCheck,
  Camera,
  ChevronRight,
  CircleDollarSign,
  Clapperboard,
  Code2,
  FileText,
  Heart,
  HeartHandshake,
  Mic,
  MoreHorizontal,
  Music2,
  PenLine,
  Play,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type IconComponent = ComponentType<{ className?: string }>

const categoryTiles = [
  { name: 'Graphic Design', slug: 'brand-design', icon: PenLine },
  { name: 'Video Editing', slug: 'video-production', icon: Clapperboard },
  { name: 'Music Production', slug: 'worship-audio', icon: Music2 },
  { name: 'Website Development', slug: 'web-development', icon: Code2 },
  { name: 'Church Media', slug: 'church-media', icon: Users },
  { name: 'Writing', slug: 'writing-strategy', icon: FileText },
  { name: 'Photography', slug: 'photography', icon: Camera },
  { name: 'Voice Over', slug: 'voice-over', icon: Mic },
  { name: 'Social Media', slug: 'social-media', icon: BadgeCheck },
  { name: 'More', slug: '', icon: MoreHorizontal },
]

const popularServices: Array<[string, string, IconComponent]> = [
  ['Graphic Design', '', PenLine],
  ['Video Editing', '', Clapperboard],
  ['Music Production', '', Music2],
  ['Website Development', '', Code2],
  ['Church Media', '', Users],
  ['Writing', '', FileText],
]

const featuredServices = [
  {
    creator: 'Grace Designs',
    level: 'Top Rated',
    title: 'I will design a modern minimal logo for your brand',
    rating: '4.9',
    reviews: '128',
    price: '$50',
    href: '/marketplace/brand-design',
    image:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=760&h=520&fit=crop',
  },
  {
    creator: 'Visuals by Mark',
    level: 'Level 2',
    title: 'I will edit your sermon or church event video',
    rating: '5.0',
    reviews: '96',
    price: '$150',
    href: '/marketplace/video-production',
    image:
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=760&h=520&fit=crop',
  },
  {
    creator: 'Kingdom Sounds',
    level: 'Top Rated',
    title: 'I will produce a worship instrumental or song',
    rating: '4.9',
    reviews: '87',
    price: '$100',
    href: '/marketplace/worship-audio',
    image:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=760&h=520&fit=crop',
  },
  {
    creator: 'Code for Christ',
    level: 'Level 2',
    title: 'I will build a modern church or ministry website',
    rating: '4.9',
    reviews: '74',
    price: '$250',
    href: '/marketplace/web-development',
    image:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=760&h=520&fit=crop',
  },
  {
    creator: 'Light & Glory Media',
    level: 'Top Rated',
    title: 'I will create engaging church slides and motion graphics',
    rating: '5.0',
    reviews: '63',
    price: '$75',
    href: '/marketplace/church-media',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=760&h=520&fit=crop',
  },
]

const creators = [
  ['Grace Designs', 'Top Rated Seller', '4.9', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop'],
  ['Visuals by Mark', 'Top Rated Seller', '5.0', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop'],
  ['Kingdom Sounds', 'Top Rated Seller', '4.9', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop'],
  ['Code for Christ', 'Level 2 Seller', '4.9', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=96&h=96&fit=crop'],
  ['Light & Glory Media', 'Top Rated Seller', '5.0', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=96&h=96&fit=crop'],
]

const trustItems: Array<[IconComponent, string, string]> = [
  [HeartHandshake, 'Faith-centered community', ''],
  [BadgeCheck, 'Quality signals', ''],
  [ShieldCheck, 'Protected beta workflow', ''],
  [Users, 'Support that cares', ''],
]

export default function Home() {
  return (
    <div className='bg-white text-[#111827]'>
      <section className='mx-auto max-w-[1510px] px-4 py-5 sm:px-6'>
        <div className='grid gap-5 xl:grid-cols-[1fr_240px]'>
          <div>
            <div className='grid gap-6 lg:grid-cols-[0.88fr_1.42fr]'>
              <div className='pt-2 lg:pt-5'>
                <h1 className='max-w-[520px] font-serif text-[2.55rem] font-extrabold leading-[1.03] tracking-normal text-[#101828] sm:text-6xl'>
                  Kingdom Marketplace
                </h1>
                <div className='mt-7 flex flex-wrap gap-3'>
                  <Link href='/marketplace'>
                    <Button className='h-11 rounded-md bg-[#101828] px-6 text-sm font-bold text-white hover:bg-[#1f2937]'>
                      Find Services
                    </Button>
                  </Link>
                  <Link href='/signup?role=buyer'>
                    <Button variant='outline' className='h-11 rounded-md border-[#d8c9b5] bg-white px-5 text-sm font-bold text-[#101828] hover:bg-[#faf7f0]'>
                      Hire a Creator
                      <Play className='ml-2 h-3.5 w-3.5' />
                    </Button>
                  </Link>
                </div>
                <div className='mt-7 flex items-center gap-4'>
                  <div className='flex -space-x-2'>
                    {creators.slice(0, 5).map(([name, , , avatar]) => (
                      <Image
                        key={name}
                        src={avatar}
                        alt=''
                        width={36}
                        height={36}
                        sizes='36px'
                        className='h-9 w-9 rounded-full border-2 border-white object-cover'
                      />
                    ))}
                  </div>
                  <div>
                    <div className='flex items-center gap-1 text-[#bd7b25]'>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} className='h-3.5 w-3.5 fill-current' />
                      ))}
                      <span className='ml-1 text-xs font-extrabold text-[#101828]'>4.9</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className='grid gap-5 lg:grid-cols-[1.1fr_0.8fr]'>
                <div className='relative min-h-[320px] overflow-hidden rounded-lg border border-[#efe7dc] bg-[#f8f3ea]'>
                  <Image
                    src='/images/kingdom-creator-collage.png'
                    alt='Christian creatives working on music, design, video, and writing projects'
                    fill
                    priority
                    sizes='(min-width: 1024px) 520px, 100vw'
                    className='object-cover'
                  />
                </div>

                <div className='rounded-lg border border-[#efe7dc] bg-white p-5 shadow-[0_12px_38px_rgba(16,24,40,0.04)]'>
                  <div className='mb-4 flex items-center justify-between'>
                    <h2 className='text-sm font-extrabold'>Explore popular services</h2>
                    <Link href='/marketplace' className='text-xs font-bold text-[#667085] hover:text-[#101828]'>
                      View all
                    </Link>
                  </div>
                  <div className='space-y-1'>
                    {popularServices.map(([title, subtitle, Icon]) => (
                      <Link
                        key={title as string}
                        href='/marketplace'
                        className='flex items-center gap-3 rounded-md px-2 py-2.5 transition hover:bg-[#faf7f0]'
                      >
                        <span className='grid h-8 w-8 shrink-0 place-items-center rounded-md border border-[#efe7dc] bg-[#fbfaf7]'>
                          <Icon className='h-4 w-4 text-[#101828]' />
                        </span>
                        <span className='min-w-0 flex-1'>
                          <span className='block truncate text-xs font-extrabold'>{title as string}</span>
                          {subtitle ? <span className='block truncate text-[11px] text-[#667085]'>{subtitle as string}</span> : null}
                        </span>
                        <ChevronRight className='h-3.5 w-3.5 text-[#98a2b3]' />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className='mt-7'>
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-sm font-extrabold'>Browse by category</h2>
                <Link href='/marketplace' className='text-xs font-bold text-[#667085] hover:text-[#101828]'>
                  View all categories
                </Link>
              </div>
              <div className='grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-10'>
                {categoryTiles.map(({ name, slug, icon: Icon }, index) => (
                  <Link
                    key={name}
                    href={slug ? `/marketplace/${slug}` : '/marketplace'}
                    className={`grid min-h-[66px] place-items-center rounded-lg border bg-white px-2 py-3 text-center transition hover:-translate-y-0.5 hover:border-[#d7aa5a] ${
                      index === 0 ? 'border-[#d7aa5a] text-[#bd7b25]' : 'border-[#efe7dc] text-[#4b5563]'
                    }`}
                  >
                    <Icon className='h-5 w-5' />
                    <span className='mt-2 text-[11px] font-bold leading-4'>{name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className='mt-7'>
              <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
                <h2 className='text-sm font-extrabold'>Featured services</h2>
                <div className='flex rounded-md bg-[#faf7f0] p-1 text-[11px] font-bold text-[#667085]'>
                  {['Popular', 'Newest', 'Top Rated'].map((item, index) => (
                    <span key={item} className={`rounded px-3 py-1.5 ${index === 0 ? 'bg-white text-[#101828] shadow-sm' : ''}`}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
                {featuredServices.map((service) => (
                  <Link
                    key={service.title}
                    href={service.href}
                    className='group overflow-hidden rounded-lg border border-[#efe7dc] bg-white transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(16,24,40,0.08)]'
                  >
                    <div className='relative aspect-[1.55] overflow-hidden bg-[#f7f3ec]'>
                      <Image
                        src={service.image}
                        alt={service.title}
                        fill
                        sizes='(min-width: 1024px) 220px, (min-width: 640px) 50vw, 100vw'
                        className='object-cover transition duration-500 group-hover:scale-105'
                      />
                      <Heart className='absolute right-3 top-3 h-5 w-5 fill-white/90 text-[#101828]' />
                    </div>
                    <div className='p-3'>
                      <div className='mb-2 flex items-center justify-between gap-2'>
                        <p className='truncate text-xs font-extrabold'>{service.creator}</p>
                        <span className='shrink-0 rounded bg-[#fff8eb] px-2 py-1 text-[10px] font-bold text-[#bd7b25]'>
                          {service.level}
                        </span>
                      </div>
                      <p className='line-clamp-2 min-h-[36px] text-xs font-semibold leading-5 text-[#344054]'>{service.title}</p>
                      <div className='mt-2 flex items-center gap-1 text-[11px] font-bold text-[#101828]'>
                        <Star className='h-3.5 w-3.5 fill-[#bd7b25] text-[#bd7b25]' />
                        {service.rating}
                        <span className='font-medium text-[#98a2b3]'>({service.reviews})</span>
                      </div>
                      <div className='mt-3 flex items-center justify-between'>
                        <p className='text-xs font-extrabold'>From {service.price}</p>
                        <Heart className='h-4 w-4 text-[#98a2b3]' />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className='mt-7 grid gap-3 rounded-lg border border-[#efe7dc] bg-[#fbfaf7] px-4 py-4 sm:grid-cols-2 lg:grid-cols-4'>
              {trustItems.map(([Icon, title, body]) => (
                <div key={title as string} className='flex items-center gap-3'>
                  <Icon className='h-6 w-6 shrink-0 text-[#101828]' />
                  <div>
                    <p className='text-xs font-extrabold'>{title as string}</p>
                    {body ? <p className='mt-0.5 text-[11px] text-[#667085]'>{body as string}</p> : null}
                  </div>
                </div>
              ))}
            </div>

            <div className='mt-5 text-center'>
              <div className='mt-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-extrabold text-[#98a2b3]'>
                {['Elevation Church', 'Bethel Church', 'Hillsong Church', 'Passion City Church', 'Compassion', 'World Relief'].map((name) => (
                  <span key={name}>{name}</span>
                ))}
              </div>
            </div>
          </div>

          <aside className='grid gap-5 xl:block xl:space-y-5'>
            <div className='rounded-lg border border-[#efe7dc] bg-[#fbfaf7] p-5'>
              <h2 className='text-sm font-extrabold'>Become a seller</h2>
              <div className='mt-4 space-y-2'>
                {['Create your profile', 'Add your services', 'Get discovered', 'Grow your impact'].map((item) => (
                  <div key={item} className='flex items-center gap-2 text-xs font-semibold text-[#667085]'>
                    <CircleDollarSign className='h-3.5 w-3.5 text-[#bd7b25]' />
                    {item}
                  </div>
                ))}
              </div>
              <Link href='/signup'>
                <Button className='mt-5 h-10 rounded-md bg-[#101828] px-5 text-xs font-bold text-white hover:bg-[#1f2937]'>
                  Get Started
                </Button>
              </Link>
              <div className='mt-4 flex items-center gap-3'>
                <div className='flex -space-x-2'>
                  {creators.slice(0, 4).map(([name, , , avatar]) => (
                    <Image
                      key={name}
                      src={avatar}
                      alt=''
                      width={26}
                      height={26}
                      sizes='26px'
                      className='h-6 w-6 rounded-full border-2 border-[#fbfaf7] object-cover'
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className='rounded-lg border border-[#efe7dc] bg-white p-5'>
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-sm font-extrabold'>Top creators</h2>
                <Link href='/marketplace' className='text-xs font-bold text-[#667085] hover:text-[#101828]'>
                  View all
                </Link>
              </div>
              <div className='space-y-4'>
                {creators.map(([name, title, rating, avatar]) => (
                  <Link key={name} href='/marketplace' className='flex items-center gap-3 rounded-md transition hover:bg-[#faf7f0]'>
                    <Image
                      src={avatar}
                      alt={`${name} profile`}
                      width={38}
                      height={38}
                      sizes='38px'
                      className='h-10 w-10 rounded-full object-cover'
                    />
                    <span className='min-w-0 flex-1'>
                      <span className='block truncate text-xs font-extrabold'>{name}</span>
                      <span className='mt-0.5 block truncate text-[11px] text-[#667085]'>{title}</span>
                      <span className='mt-0.5 flex items-center gap-1 text-[11px] font-bold text-[#bd7b25]'>
                        <Star className='h-3 w-3 fill-current' />
                        {rating}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
