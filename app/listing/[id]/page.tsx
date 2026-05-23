import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Clock3, Heart, MessageCircle, ShieldCheck, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

const listings = {
  'christian-flyer': {
    title: 'I will design a stunning Christian flyer',
    creator: 'Grace Designs',
    category: 'Graphic Design',
    rating: 4.9,
    reviews: 120,
    price: 50,
    delivery: '2 days',
    image: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=1200&h=900&fit=crop',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=160&h=160&fit=crop',
    description:
      'Custom ministry flyers, event graphics, sermon series artwork, and social posts designed with clean typography and a polished church-ready finish.',
  },
  'sermon-edit': {
    title: 'I will edit your sermon or event video',
    creator: 'Visuals by Mark',
    category: 'Video Editing',
    rating: 5,
    reviews: 18,
    price: 150,
    delivery: '4 days',
    image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&h=900&fit=crop',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop',
    description:
      'Sermon cuts, recap edits, lower thirds, color correction, captions, and social clips for churches and faith-centered events.',
  },
  'worship-instrumental': {
    title: 'I will produce worship instrumentals',
    creator: 'Kingdom Sounds',
    category: 'Music Production',
    rating: 4.8,
    reviews: 76,
    price: 100,
    delivery: '5 days',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&h=900&fit=crop',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&h=160&fit=crop',
    description:
      'Warm worship instrumentals, backing tracks, arrangements, and stems for artists, churches, and worship teams.',
  },
  'church-site': {
    title: 'I will create a modern church website',
    creator: 'WebFaith Studio',
    category: 'Website Development',
    rating: 4.9,
    reviews: 106,
    price: 200,
    delivery: '7 days',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=900&fit=crop',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=160&h=160&fit=crop',
    description:
      'Responsive websites for churches, ministries, events, and Christian brands with donation, sermon, and contact sections.',
  },
  'faith-blog': {
    title: 'I will write faith-based blog content',
    creator: 'Graceful Pen',
    category: 'Writing',
    rating: 4.8,
    reviews: 54,
    price: 75,
    delivery: '3 days',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&h=900&fit=crop',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop',
    description:
      'Devotionals, blog posts, newsletters, launch copy, and ministry updates written with clarity and pastoral sensitivity.',
  },
  'brand-identity': {
    title: 'I will design your brand identity',
    creator: 'Purpose Brand Co.',
    category: 'Graphic Design',
    rating: 4.9,
    reviews: 88,
    price: 250,
    delivery: '6 days',
    image: 'https://images.unsplash.com/photo-1635405074683-96d6921a2a68?w=1200&h=900&fit=crop',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&h=160&fit=crop',
    description:
      'Logo direction, color system, typography, launch graphics, and brand rules for purpose-driven teams and ministries.',
  },
}

type ListingId = keyof typeof listings

export function generateStaticParams() {
  return Object.keys(listings).map((id) => ({ id }))
}

export default function ListingPage({ params }: { params: { id: string } }) {
  const listing = listings[params.id as ListingId]

  if (!listing) {
    notFound()
  }

  return (
    <div className='min-h-screen bg-[#f7f3ec] px-3 py-4 sm:px-6 sm:py-8'>
      <div className='mx-auto max-w-6xl'>
        <Link href='/marketplace' className='mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#8a5a18]'>
          <ArrowLeft className='h-4 w-4' />
          Back to marketplace
        </Link>

        <div className='grid gap-5 lg:grid-cols-[1fr_380px]'>
          <main className='overflow-hidden rounded-lg border border-[#eadfce] bg-white'>
            <div className='relative aspect-[4/3] bg-[#f2eadc] sm:aspect-[16/10]'>
              <Image src={listing.image} alt={listing.title} fill priority sizes='(min-width: 1024px) 720px, 100vw' className='object-cover' />
            </div>
            <div className='p-5 sm:p-7'>
              <p className='text-sm font-bold text-[#a36d1b]'>{listing.category}</p>
              <h1 className='mt-2 text-3xl font-extrabold leading-tight text-[#101828] sm:text-4xl'>{listing.title}</h1>
              <div className='mt-4 flex flex-wrap items-center gap-3 text-sm text-[#667085]'>
                <span className='flex items-center gap-1 font-bold text-[#101828]'>
                  <Star className='h-4 w-4 fill-[#d8952f] text-[#d8952f]' />
                  {listing.rating.toFixed(1)}
                </span>
                <span>{listing.reviews} reviews</span>
                <span className='flex items-center gap-1'>
                  <Clock3 className='h-4 w-4' />
                  {listing.delivery} delivery
                </span>
              </div>
              <section className='mt-8'>
                <h2 className='text-xl font-extrabold'>About this service</h2>
                <p className='mt-3 text-base leading-7 text-[#4b5563]'>{listing.description}</p>
              </section>
              <section className='mt-8 grid gap-3 sm:grid-cols-3'>
                {['Clear scope before work starts', 'Faith-aware creative direction', 'Revision-friendly delivery'].map((item) => (
                  <div key={item} className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-4'>
                    <CheckCircle2 className='h-5 w-5 text-[#15803d]' />
                    <p className='mt-3 text-sm font-bold'>{item}</p>
                  </div>
                ))}
              </section>
            </div>
          </main>

          <aside className='h-fit rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5 shadow-[0_18px_60px_rgba(33,24,10,0.08)] sm:p-6'>
            <div className='flex items-center gap-4'>
              <Image src={listing.avatar} alt={listing.creator} width={64} height={64} sizes='64px' className='h-16 w-16 rounded-full object-cover' />
              <div>
                <h2 className='text-xl font-extrabold'>{listing.creator}</h2>
                <p className='text-sm text-[#667085]'>Verified creator</p>
              </div>
            </div>
            <div className='my-6 rounded-lg border border-[#eadfce] bg-white p-4'>
              <div className='flex items-end justify-between gap-3'>
                <div>
                  <p className='text-xs font-bold uppercase tracking-wide text-[#667085]'>Starting at</p>
                  <p className='mt-1 text-3xl font-extrabold'>${listing.price}</p>
                </div>
                <ShieldCheck className='h-7 w-7 text-[#15803d]' />
              </div>
              <p className='mt-3 text-sm leading-6 text-[#667085]'>Message the creator to confirm scope, files, timeline, and project fit before booking.</p>
            </div>
            <div className='grid gap-3'>
              <Button className='h-11 w-full bg-[#101828] text-white hover:bg-[#1f2937]'>
                <MessageCircle className='mr-2 h-4 w-4' />
                Message creator
              </Button>
              <Button variant='outline' className='h-11 w-full border-[#d8aa5e] bg-white text-[#8a5a18] hover:bg-[#fff3dc]'>
                <Heart className='mr-2 h-4 w-4' />
                Save service
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
