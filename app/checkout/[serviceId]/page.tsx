import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { CheckoutForm } from '@/components/marketplace/checkout-form'
import { getMarketplaceServiceBySlug } from '@/domains/marketplace'
import { createPublicServerClient } from '@/lib/supabase-public'

export const dynamic = 'force-dynamic'

export default async function CheckoutPage({ params }: { params: { serviceId: string } }) {
  const supabase = createPublicServerClient()
  const service = await getMarketplaceServiceBySlug(supabase, params.serviceId)

  if (!service) notFound()

  const fee = Math.round(service.price * 0.05)

  return (
    <div className='min-h-screen bg-[#f7f3ec] px-3 py-4 sm:px-6 sm:py-8'>
      <div className='mx-auto max-w-6xl'>
        <Link href={`/listing/${service.slug}`} className='mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#8a5a18]'>
          <ArrowLeft className='h-4 w-4' />
          Back to service
        </Link>
        <CheckoutForm
          serviceId={service.id}
          serviceTitle={service.title}
          sellerName={service.seller.fullName}
          price={service.price}
          fee={fee}
          sellerEarns={service.price - fee}
          requirements={service.requirements}
          cancellationPolicy={service.cancellationPolicy}
        />
      </div>
    </div>
  )
}
