import { BadgeCheck, Sparkles, Trophy } from 'lucide-react'
import { SellerSummary } from '@/lib/marketplace/types'

type SellerStatusBadgesProps = {
  seller: SellerSummary
  className?: string
  compact?: boolean
}

export function SellerStatusBadges({ seller, className = '', compact = false }: SellerStatusBadgesProps) {
  const isTopRated = seller.rating >= 4.8 && seller.reviewsCount >= 5
  const isReviewed = seller.verificationStatus === 'verified'
  const isNew = seller.reviewsCount === 0
  const sizeClass = compact ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1 text-xs'

  if (!isTopRated && !isReviewed && !isNew) return null

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {isTopRated && (
        <span className={`inline-flex items-center gap-1 rounded-full border border-[#fde68a] bg-[#fffbeb] font-extrabold text-[#92400e] ${sizeClass}`}>
          <Trophy className='h-3.5 w-3.5 fill-[#fef3c7] text-[#b45309]' />
          Top rated
        </span>
      )}
      {isReviewed && (
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] font-extrabold text-[#15803d] ${sizeClass}`}
          title='Seller reviewed'
        >
          <BadgeCheck className='h-3.5 w-3.5 fill-[#dcfce7] text-[#15803d]' />
          Reviewed
        </span>
      )}
      {isNew && (
        <span className={`inline-flex items-center gap-1 rounded-full border border-[#bfdbfe] bg-[#eff6ff] font-extrabold text-[#1d4ed8] ${sizeClass}`}>
          <Sparkles className='h-3.5 w-3.5 text-[#2563eb]' />
          New seller
        </span>
      )}
    </div>
  )
}
