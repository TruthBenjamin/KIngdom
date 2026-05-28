import Image from 'next/image'
import Link from 'next/link'
import { Clock3, ShieldCheck, Star } from 'lucide-react'
import { MarketplaceService } from '@/lib/marketplace/types'
import { formatCurrency } from '@/lib/utils'

const fallbackImage =
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=760&h=760&fit=crop'

export function ServiceCard({ service }: { service: MarketplaceService }) {
  const rating = service.seller.rating > 0 ? service.seller.rating.toFixed(1) : 'New'

  return (
    <Link
      href={`/listing/${service.slug}`}
      className='group block overflow-hidden rounded-lg border border-[#eadfce] bg-[#fffdf8] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(33,24,10,0.12)]'
    >
      <div className='relative aspect-[1.05] overflow-hidden bg-[#f2eadc]'>
        <Image
          src={service.mediaUrl || fallbackImage}
          alt={service.title}
          fill
          sizes='(min-width: 1280px) 280px, (min-width: 768px) 45vw, 100vw'
          className='object-cover transition duration-500 group-hover:scale-105'
        />
      </div>
      <div className='p-4'>
        <div className='mb-2 flex items-center justify-between gap-2'>
          <p className='truncate text-xs font-bold text-[#8a5a18]'>{service.category}</p>
          {(service.isFeatured || service.seller.verificationStatus === 'verified') && (
            <span className='inline-flex items-center gap-1 text-[11px] font-bold text-[#15803d]'>
              <ShieldCheck className='h-3.5 w-3.5' />
              {service.isFeatured ? 'Featured' : 'Verified'}
            </span>
          )}
        </div>
        <p className='line-clamp-2 min-h-[42px] text-sm font-extrabold leading-5'>{service.title}</p>
        <p className='mt-2 truncate text-xs text-[#667085]'>{service.seller.fullName}</p>
        <div className='mt-3 flex items-center justify-between text-xs'>
          <span className='flex items-center gap-1'>
            <Star className='h-3.5 w-3.5 fill-[#d8952f] text-[#d8952f]' />
            <b>{rating}</b>
            {service.seller.reviewsCount > 0 && <span className='text-[#98a2b3]'>({service.seller.reviewsCount})</span>}
          </span>
          <span className='flex items-center gap-1 text-[#667085]'>
            <Clock3 className='h-3.5 w-3.5' />
            {service.deliveryDays}d
          </span>
        </div>
        <div className='mt-4 flex items-end justify-between gap-3'>
          <p className='text-sm font-extrabold'>From {formatCurrency(service.price)}</p>
          <span className='rounded-full bg-white px-2 py-1 text-[11px] font-bold text-[#667085]'>
            {service.revisionCount} rev
          </span>
        </div>
      </div>
    </Link>
  )
}
