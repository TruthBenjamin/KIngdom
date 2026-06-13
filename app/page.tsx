import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, CalendarCheck, CheckCircle2, Code2, FileText, MessageCircle, Mic2, Palette, Search, ShieldCheck, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { marketplaceCategoryHref } from '@/lib/navigation'

const coreCategories = [
  { id: 'brand-design', name: 'Brand Design', slug: 'brand-design', icon: Palette, description: 'Identity, graphics, launch assets, and brand systems.' },
  { id: 'video-production', name: 'Video Production', slug: 'video-production', icon: Video, description: 'Editing, reels, event recaps, and story-driven media.' },
  { id: 'worship-audio', name: 'Worship Audio', slug: 'worship-audio', icon: Mic2, description: 'Mixing, production, voice work, and ministry audio.' },
  { id: 'web-development', name: 'Web Development', slug: 'web-development', icon: Code2, description: 'Websites, landing pages, stores, and technical support.' },
  { id: 'writing-strategy', name: 'Writing Strategy', slug: 'writing-strategy', icon: FileText, description: 'Copy, content planning, scripts, and campaign messaging.' },
  { id: 'event-support', name: 'Event Support', slug: 'event-support', icon: CalendarCheck, description: 'Creative and operational help around live moments.' },
]

export default function Home() {
  return (
    <div className='bg-white text-[#101828]'>
      <section className='mx-auto grid max-w-[1320px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] lg:items-center lg:py-12'>
        <div>
          <p className='text-xs font-extrabold uppercase tracking-[0.14em] text-[#8a5a18]'>Kingdom Marketplace</p>
          <h1 className='mt-4 max-w-2xl text-4xl font-extrabold leading-tight tracking-normal text-[#101828] sm:text-5xl'>
            Hire reviewed creators for ministry, media, and business work.
          </h1>
          <p className='mt-5 max-w-xl text-base leading-7 text-[#5b6472]'>
            Find available services, compare seller signals, message before booking, and keep orders inside one protected workflow.
          </p>

          <form action='/marketplace' className='mt-7 flex max-w-2xl flex-col gap-3 rounded-lg border border-[#d8c9b5] bg-white p-2 shadow-[0_16px_44px_rgba(16,24,40,0.08)] sm:flex-row'>
            <label className='relative min-w-0 flex-1'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]' />
              <span className='sr-only'>Search marketplace</span>
              <input
                name='q'
                placeholder='Search logo design, video editing, web, audio...'
                className='h-12 w-full rounded-md border-0 bg-[#fbfaf7] pl-10 pr-3 text-sm font-medium text-[#101828] outline-none ring-[#d8952f] focus:ring-2'
              />
            </label>
            <Button className='h-12 rounded-md bg-[#101828] px-6 text-sm font-extrabold text-white hover:bg-[#1f2937]'>
              Find services
              <ArrowRight className='ml-2 h-4 w-4' />
            </Button>
          </form>

          <div className='mt-5 flex flex-wrap gap-2'>
            <Link href='/marketplace'>
              <Button variant='outline' className='h-10 rounded-md border-[#d8c9b5] bg-white px-4 text-sm font-bold text-[#101828] hover:bg-[#faf7f0]'>
                Hire a creator
              </Button>
            </Link>
            <Link href='/signup?role=seller'>
              <Button variant='ghost' className='h-10 rounded-md px-4 text-sm font-bold text-[#8a5a18] hover:bg-[#fff3dc] hover:text-[#101828]'>
                Become a seller
              </Button>
            </Link>
          </div>
        </div>

        <div className='relative min-h-[360px] overflow-hidden rounded-lg border border-[#eadfce] bg-[#f7f1e7] lg:min-h-[500px]'>
          <Image
            src='/images/kingdom-creator-collage.png'
            alt='Kingdom creators collaborating on marketplace work'
            fill
            priority
            sizes='(min-width: 1024px) 620px, 100vw'
            className='object-cover'
          />
          <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#101828]/84 to-transparent p-5 text-white'>
            <div className='grid gap-3 sm:grid-cols-3'>
              {[
                [BadgeCheck, 'Reviewed listings'],
                [MessageCircle, 'Message first'],
                [ShieldCheck, 'Protected orders'],
              ].map(([Icon, label]) => (
                <div key={label as string} className='flex items-center gap-2 rounded-md bg-white/12 px-3 py-2 backdrop-blur'>
                  <Icon className='h-4 w-4 text-[#f0c56a]' />
                  <span className='text-xs font-extrabold'>{label as string}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className='border-y border-[#eadfce] bg-[#fffdf8]'>
        <div className='mx-auto grid max-w-[1320px] gap-4 px-4 py-6 sm:px-6 md:grid-cols-3'>
          {[
            ['Vetting before visibility', 'Seller profiles and services are reviewed before marketplace exposure.'],
            ['Scope before payment', 'Buyers can message creators to confirm files, deadlines, and revisions.'],
            ['Order records stay together', 'Checkout connects requirements, payment status, delivery, and reviews.'],
          ].map(([title, body]) => (
            <div key={title} className='flex gap-3'>
              <CheckCircle2 className='mt-0.5 h-5 w-5 shrink-0 text-[#15803d]' />
              <div>
                <h2 className='text-sm font-extrabold'>{title}</h2>
                <p className='mt-1 text-sm leading-6 text-[#667085]'>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className='mx-auto max-w-[1320px] px-4 py-8 sm:px-6'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h2 className='text-2xl font-extrabold'>Browse categories</h2>
            <p className='mt-2 text-sm text-[#667085]'>Start with the work you need, then compare live services.</p>
          </div>
          <Link href='/marketplace' className='inline-flex items-center text-sm font-extrabold text-[#8a5a18] hover:text-[#101828]'>
            View marketplace
            <ArrowRight className='ml-1 h-4 w-4' />
          </Link>
        </div>

        <div className='mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          {coreCategories.map(({ icon: Icon, ...category }) => (
            <Link
              key={category.id}
              href={marketplaceCategoryHref(category.slug)}
              className='rounded-lg border border-[#eadfce] bg-white p-4 transition hover:border-[#d8aa5e] hover:shadow-[0_16px_38px_rgba(16,24,40,0.06)]'
            >
              <Icon className='h-5 w-5 text-[#8a5a18]' />
              <h3 className='mt-4 text-sm font-extrabold'>{category.name}</h3>
              <p className='mt-2 line-clamp-2 text-xs leading-5 text-[#667085]'>{category.description || 'Reviewed marketplace services.'}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className='mx-auto max-w-[1320px] px-4 pb-10 sm:px-6'>
        <div className='rounded-lg border border-[#eadfce] bg-[#101828] p-6 text-white sm:p-8'>
          <div className='max-w-3xl'>
            <h2 className='text-2xl font-extrabold'>A simpler vetting path</h2>
            <p className='mt-3 text-sm leading-6 text-white/72'>
              Sellers complete a profile, services enter review, and buyers see clearer quality signals before checkout. The marketplace should feel focused: search, compare, message, book.
            </p>
          </div>
          <Link href='/marketplace' className='mt-6 inline-flex items-center rounded-md bg-[#f0c56a] px-5 py-3 text-sm font-extrabold text-[#101828] hover:bg-[#f6d68a]'>
            Browse reviewed services
            <ArrowRight className='ml-2 h-4 w-4' />
          </Link>
        </div>
      </section>
    </div>
  )
}
