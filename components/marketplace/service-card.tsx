import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, Clock3, MapPin, ShieldCheck, Star } from 'lucide-react'
import { MarketplaceService } from '@/lib/marketplace/types'
import { isVideoMedia } from '@/lib/marketplace/media'
import { formatCurrency, formatResponseTime } from '@/lib/utils'
import { SellerStatusBadges } from './seller-status-badges'

const fallbackImages = [
  'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=900&h=700&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=900&h=700&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=900&h=700&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&h=700&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=900&h=700&fit=crop&auto=format',
]

function fallbackImageFor(service: MarketplaceService) {
  const seed = `${service.categorySlug}-${service.slug || service.id}`
  const index = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0) % fallbackImages.length
  return fallbackImages[index]
}

export function ServiceCard({ service }: { service: MarketplaceService }) {
  const rating = service.seller.rating > 0 ? service.seller.rating.toFixed(1) : 'New'
  const hasVideoMedia = isVideoMedia(service.mediaUrl)
  const imageUrl = service.mediaUrl || fallbackImageFor(service)

  return (
    <Link
      href={`/listing/${service.slug}`}
      className='group block overflow-hidden rounded-lg border border-[#eadfce] bg-[#fffdf8] transition duration-200 hover:-translate-y-0.5 hover:border-[#d8c4a7] hover:bg-white hover:shadow-[0_18px_40px_rgba(33,24,10,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8952f]'
    >
      <div className='relative aspect-[1.05] overflow-hidden bg-[#f2eadc]'>
        {hasVideoMedia && service.mediaUrl ? (
          <video
            src={service.mediaUrl}
            muted
            playsInline
            preload='metadata'
            className='h-full w-full object-cover transition duration-500 group-hover:scale-105'
          />
        ) : (
          <Image
            src={imageUrl}
            alt={service.title}
            fill
            sizes='(min-width: 1280px) 280px, (min-width: 768px) 45vw, 100vw'
            className='object-cover transition duration-500 group-hover:scale-105'
          />
        )}
        {hasVideoMedia && (
          <div className='absolute bottom-3 left-3 rounded-full bg-[#101828]/90 px-2.5 py-1 text-[11px] font-extrabold text-white'>
            Video
          </div>
        )}
        {service.isFeatured && (
          <div className='absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-extrabold text-[#101828] shadow-sm'>
            Featured
          </div>
        )}
      </div>
      <div className='p-4'>
        <div className='mb-2 flex items-center justify-between gap-2'>
          <p className='truncate text-xs font-bold text-[#8a5a18]'>{service.category}</p>
        </div>
        <p className='line-clamp-2 min-h-[42px] text-sm font-extrabold leading-5'>{service.title}</p>
        <div className='mt-2 flex min-w-0 items-center justify-between gap-3 text-xs text-[#667085]'>
          <p className='min-w-0 truncate'>{service.seller.fullName}</p>
          {service.seller.location && (
            <span className='flex min-w-0 shrink items-center gap-1'>
              <MapPin className='h-3 w-3' />
              <span className='truncate'>{service.seller.location}</span>
            </span>
          )}
        </div>
        <SellerStatusBadges seller={service.seller} compact className='mt-3 min-h-[24px]' />
        <div className='mt-3 flex items-center justify-between text-xs'>
          <span className='flex items-center gap-1'>
            <Star className='h-3.5 w-3.5 fill-[#d8952f] text-[#d8952f]' />
            <b>{rating}</b>
            {service.seller.reviewsCount > 0 && <span className='text-[#98a2b3]'>({service.seller.reviewsCount})</span>}
          </span>
          <span className='flex items-center gap-1 text-[#667085]'>
            <Clock3 className='h-3.5 w-3.5' />
            {formatResponseTime(service.seller.responseTimeMinutes)}
          </span>
        </div>
        <div className='mt-3 grid grid-cols-2 gap-2 text-[11px] font-bold text-[#667085]'>
          <span className='inline-flex items-center gap-1 rounded-md bg-white px-2 py-1.5'>
            <ShieldCheck className='h-3.5 w-3.5 text-[#15803d]' />
            Reviewed
          </span>
          <span className='inline-flex items-center gap-1 rounded-md bg-white px-2 py-1.5'>
            <BadgeCheck className='h-3.5 w-3.5 text-[#8a5a18]' />
            {service.seller.verificationStatus === 'verified' ? 'Verified' : 'Profile checked'}
          </span>
        </div>
        {!!service.tags.length && (
          <div className='mt-3 flex gap-1.5 overflow-hidden'>
            {service.tags.slice(0, 3).map((tag) => (
              <span key={tag} className='truncate rounded-full bg-white px-2 py-1 text-[10px] font-bold text-[#667085]'>
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className='mt-4 flex items-end justify-between gap-3'>
          <p className='min-w-0 text-sm font-extrabold'>From {formatCurrency(service.price)}</p>
          <span className='rounded-full bg-white px-2 py-1 text-[11px] font-bold text-[#667085]'>
            {service.revisionCount} rev
          </span>
        </div>
      </div>
    </Link>
  )
}
