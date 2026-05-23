'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { ElementType } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Clapperboard,
  Code2,
  FileText,
  HeartHandshake,
  Mic2,
  Music2,
  PenTool,
  Play,
  Search,
  Sparkles,
  Star,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const heroServices = [
  {
    title: 'Music Production',
    creator: 'Worship & Gospel',
    price: '$150',
    image:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=760&h=540&fit=crop',
  },
  {
    title: 'Graphic Design',
    creator: 'Branding & Design',
    price: '$80',
    image:
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=760&h=540&fit=crop',
  },
  {
    title: 'Video Editing',
    creator: 'Worship & Events',
    price: '$120',
    image:
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=760&h=540&fit=crop',
  },
  {
    title: 'Content Writing',
    creator: 'Articles & Copywriting',
    price: '$60',
    image:
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=760&h=540&fit=crop',
  },
]

const categories = [
  { name: 'Graphic Design', icon: PenTool },
  { name: 'Video Editing', icon: Clapperboard },
  { name: 'Music Production', icon: Music2 },
  { name: 'Church Media', icon: Camera },
  { name: 'Website Dev', icon: Code2 },
  { name: 'Writing', icon: FileText },
]

const marketplaceCards = [
  {
    title: 'I will design a stunning Christian flyer',
    creator: 'Grace Designs',
    rating: '4.9',
    price: '$50',
    image:
      'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=640&h=640&fit=crop',
  },
  {
    title: 'I will edit your sermon or event video',
    creator: 'Visuals by Mark',
    rating: '5.0',
    price: '$150',
    image:
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=640&h=640&fit=crop',
  },
  {
    title: 'I will produce worship instrumentals',
    creator: 'Kingdom Sounds',
    rating: '4.8',
    price: '$100',
    image:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=640&h=640&fit=crop',
  },
]

const statCards = [
  ['Total Earnings', '$2,450', '+12%'],
  ['Active Orders', '8', '+2 new'],
  ['Completed Orders', '56', '+8 this month'],
  ['Total Views', '1,230', '+15%'],
]

const MotionDiv = motion.div as ElementType

export default function Home() {
  return (
    <div className='bg-[#f7f3ec] text-[#111827]'>
      <section className='mx-auto max-w-[1500px] px-3 py-3 sm:px-6'>
        <div className='grid gap-3 xl:grid-cols-[1.42fr_1fr]'>
          <MotionDiv
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className='overflow-hidden rounded-lg border border-black/5 bg-[#fffdf8] shadow-[0_18px_60px_rgba(33,24,10,0.08)]'
          >
            <div className='grid gap-8 px-5 py-8 sm:px-6 sm:py-10 lg:min-h-[680px] lg:grid-cols-[0.92fr_1.08fr] lg:px-12'>
              <div className='flex flex-col justify-center'>
                <div className='mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-[#e7d5b4] bg-[#fff8eb] px-3 py-2 text-xs font-semibold text-[#9a6618]'>
                  <Sparkles className='h-4 w-4' />
                  Built for ministries, founders, and faithful creatives
                </div>

                <h1 className='max-w-xl font-serif text-4xl font-bold leading-[1.02] tracking-normal text-[#101828] sm:text-6xl lg:text-7xl'>
                  Kingdom talent,
                  <span className='block text-[#c8892a]'>trusted solutions.</span>
                </h1>

                <p className='mt-7 max-w-lg text-lg leading-8 text-[#3d4654]'>
                  Hire Christian creatives, artisans, media teams, and builders
                  for your vision, ministry, launch, or business.
                </p>

                <div className='mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap'>
                  <Link href='/marketplace'>
                    <Button size='lg' className='h-12 w-full bg-[#101828] px-7 text-white hover:bg-[#1f2937] sm:w-auto'>
                      Hire a Creator
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  </Link>
                  <Link href='/signup'>
                    <Button
                      size='lg'
                      variant='outline'
                      className='h-12 w-full border-[#d8aa5e] bg-transparent px-7 text-[#a36d1b] hover:bg-[#fff3dc] sm:w-auto'
                    >
                      Become a Seller
                    </Button>
                  </Link>
                </div>

                <div className='mt-10 sm:mt-16'>
                  <p className='mb-4 text-sm font-medium text-[#626b78]'>
                    Trusted by churches, ministries, and kingdom businesses
                  </p>
                  <div className='flex items-center gap-4'>
                    <div className='flex -space-x-3'>
                      {[
                        'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop',
                        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop',
                        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop',
                        'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=120&h=120&fit=crop',
                        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop',
                      ].map((src) => (
                        <Image
                          key={src}
                          src={src}
                          alt=''
                          width={40}
                          height={40}
                          sizes='40px'
                          className='h-10 w-10 rounded-full border-2 border-[#fffdf8] object-cover'
                        />
                      ))}
                    </div>
                    <div>
                      <p className='text-xl font-bold'>2,000+</p>
                      <p className='text-sm text-[#6b7280]'>Happy clients</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className='grid content-center gap-5 sm:grid-cols-2'>
                {heroServices.map((service, index) => (
                  <MotionDiv
                    key={service.title}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * index }}
                    className='group overflow-hidden rounded-lg border border-[#eadfce] bg-white shadow-[0_14px_30px_rgba(43,31,15,0.08)]'
                  >
                    <div className='relative aspect-[1.25] overflow-hidden'>
                      <Image
                        src={service.image}
                        alt={service.title}
                        fill
                        sizes='(min-width: 1024px) 330px, (min-width: 640px) 50vw, 100vw'
                        className='object-cover transition duration-500 group-hover:scale-105'
                      />
                    </div>
                    <div className='flex items-end justify-between p-4'>
                      <div>
                        <p className='font-semibold'>{service.title}</p>
                        <p className='mt-1 text-xs text-[#6b7280]'>{service.creator}</p>
                      </div>
                      <p className='text-xs font-semibold text-[#b97822]'>From {service.price}</p>
                    </div>
                  </MotionDiv>
                ))}
              </div>
            </div>

            <div className='border-t border-[#eee5d8] px-6 py-6 lg:px-12'>
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-xl font-bold'>Popular Categories</h2>
                <Link href='/marketplace' className='text-sm font-semibold text-[#8a5a18]'>
                  Explore top categories
                </Link>
              </div>
              <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6'>
                {categories.map(({ name, icon: Icon }) => (
                  <Link
                    href='/marketplace'
                    key={name}
                    className='rounded-lg border border-[#eadfce] bg-[#fbf7f0] p-4 text-center transition hover:-translate-y-0.5 hover:border-[#d3a04c] hover:bg-white'
                  >
                    <Icon className='mx-auto h-6 w-6 text-[#111827]' />
                    <p className='mt-3 text-xs font-semibold'>{name}</p>
                  </Link>
                ))}
              </div>
            </div>
          </MotionDiv>

          <div className='grid gap-3'>
            <div className='rounded-lg border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(33,24,10,0.08)]'>
              <div className='mb-5 flex items-center gap-3 rounded-lg border border-[#eadfce] bg-[#fffdf8] px-4 py-3'>
                <Search className='h-4 w-4 text-[#8b95a1]' />
                <span className='text-sm text-[#8b95a1]'>Search services, skills, or keywords...</span>
              </div>
              <div className='mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
                <div>
                  <p className='text-sm font-semibold text-[#a36d1b]'>Featured marketplace</p>
                  <h2 className='text-2xl font-bold'>Find the perfect service</h2>
                </div>
                <Link href='/marketplace' className='text-sm font-semibold text-[#101828]'>
                  Browse all
                </Link>
              </div>
              <div className='grid gap-4 sm:grid-cols-3'>
                {marketplaceCards.map((card) => (
                  <div key={card.title} className='overflow-hidden rounded-lg border border-[#eadfce] bg-[#fffdf8]'>
                    <div className='relative aspect-square'>
                      <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        sizes='(min-width: 640px) 180px, 100vw'
                        className='object-cover'
                      />
                    </div>
                    <div className='p-3'>
                      <p className='line-clamp-2 text-sm font-bold'>{card.title}</p>
                      <p className='mt-2 text-xs text-[#6b7280]'>{card.creator}</p>
                      <div className='mt-3 flex items-center justify-between'>
                        <span className='text-xs font-bold'>From {card.price}</span>
                        <span className='flex items-center gap-1 text-xs text-[#b97822]'>
                          <Star className='h-3 w-3 fill-[#d8952f]' />
                          {card.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='grid gap-3 lg:grid-cols-[0.92fr_1.08fr]'>
              <div className='rounded-lg bg-[#101828] p-5 text-white'>
                <div className='mb-8 flex items-center gap-3'>
                  <div className='grid h-10 w-10 place-items-center rounded-lg bg-[#d8952f] font-serif text-lg font-bold'>
                    K
                  </div>
                  <div>
                    <p className='font-bold'>KINGDOM</p>
                    <p className='text-xs text-white/55'>seller studio</p>
                  </div>
                </div>
                {['Dashboard', 'My Listings', 'Orders', 'Messages', 'Reviews', 'Earnings'].map((item, index) => (
                  <div
                    key={item}
                    className={`mb-2 flex items-center justify-between rounded-lg px-3 py-3 text-sm ${
                      index === 0 ? 'bg-white/12' : 'text-white/72'
                    }`}
                  >
                    <span>{item}</span>
                    {item === 'Messages' && (
                      <span className='rounded-full bg-[#d8952f] px-2 py-0.5 text-xs font-bold text-[#101828]'>3</span>
                    )}
                  </div>
                ))}
              </div>

              <div className='rounded-lg border border-black/5 bg-white p-5'>
                <div className='mb-5 flex items-center justify-between'>
                  <div>
                    <p className='text-2xl font-bold'>Welcome back, Mark</p>
                    <p className='text-sm text-[#6b7280]'>Here is what is happening with your bookings today.</p>
                  </div>
                  <BadgeCheck className='h-6 w-6 fill-[#d8952f] text-white' />
                </div>
                <div className='grid grid-cols-2 gap-3'>
                  {statCards.map(([label, value, delta]) => (
                    <div key={label} className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-4'>
                      <p className='text-xs text-[#6b7280]'>{label}</p>
                      <p className='mt-2 text-2xl font-bold'>{value}</p>
                      <p className='mt-1 text-xs font-semibold text-[#15803d]'>{delta}</p>
                    </div>
                  ))}
                </div>
                <div className='mt-4 rounded-lg border border-[#eadfce] bg-[#fffdf8] p-4'>
                  <div className='mb-4 flex items-center justify-between'>
                    <p className='font-bold'>Messages</p>
                    <p className='text-xs text-[#6b7280]'>Grace A. online</p>
                  </div>
                  <div className='space-y-3 text-sm'>
                    <p className='w-fit max-w-[80%] rounded-lg bg-[#f1eee8] px-4 py-3'>
                      Hi Mark, I would like to discuss a conference recap video.
                    </p>
                    <p className='ml-auto w-fit max-w-[80%] rounded-lg bg-[#edbd68] px-4 py-3 text-[#1f2937]'>
                      Hello Grace. I would love to hear more about it.
                    </p>
                    <div className='flex items-center gap-2 rounded-lg border border-[#eadfce] bg-white px-3 py-2 text-xs text-[#6b7280]'>
                      <FileText className='h-4 w-4' />
                      Conference_Brief.pdf
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='mt-3 grid gap-3 lg:grid-cols-[1fr_0.72fr]'>
          <div className='rounded-lg border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(33,24,10,0.08)]'>
            <div className='mb-5 flex items-center gap-2'>
              <HeartHandshake className='h-5 w-5 text-[#b97822]' />
              <h2 className='text-2xl font-bold'>Built for real kingdom work</h2>
            </div>
            <div className='grid gap-4 md:grid-cols-3'>
              {[
                ['Ministry ready', 'Find editors, designers, musicians, and writers who understand church context.'],
                ['Clear scope', 'Creators package services with delivery windows, pricing, and proof of work.'],
                ['Relationship first', 'Message, hire, review, and keep trusted collaborators close.'],
              ].map(([title, text]) => (
                <div key={title} className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
                  <p className='font-bold'>{title}</p>
                  <p className='mt-2 text-sm leading-6 text-[#5b6472]'>{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className='rounded-lg bg-[#101828] p-5 text-white shadow-[0_18px_60px_rgba(33,24,10,0.12)]'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-white/60'>Creator spotlight</p>
                <h2 className='mt-1 text-2xl font-bold'>Visuals by Mark</h2>
              </div>
              <div className='grid h-12 w-12 place-items-center rounded-full bg-[#d8952f]'>
                <Play className='h-5 w-5 fill-white' />
              </div>
            </div>
            <p className='mt-5 text-sm leading-6 text-white/72'>
              Lagos-based filmmaker crafting sermon edits, launch videos, and
              worship visuals for churches that need excellence without agency
              drama.
            </p>
            <div className='mt-6 grid grid-cols-3 gap-3 text-center'>
              {[
                ['120+', 'Projects'],
                ['1 hr', 'Response'],
                ['98%', 'On time'],
              ].map(([value, label]) => (
                <div key={label} className='rounded-lg bg-white/8 p-3'>
                  <p className='font-bold'>{value}</p>
                  <p className='mt-1 text-xs text-white/56'>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
