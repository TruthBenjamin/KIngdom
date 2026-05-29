import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'
import { CheckoutForm } from '@/components/marketplace/checkout-form'
import { getMarketplaceServiceBySlug } from '@/domains/marketplace'
import { createPublicServerClient } from '@/lib/supabase-public'

export const dynamic = 'force-dynamic'

export default async function CheckoutPage({ params }: { params: { serviceId: string } }) {
  const supabase = createPublicServerClient()
  const service = await getMarketplaceServiceBySlug(supabase, params.serviceId)

  if (!service) {
    return (
      <div className='grid min-h-screen place-items-center bg-[#f7f3ec] px-4 py-10 text-center'>
        <div className='max-w-md rounded-lg border border-[#eadfce] bg-white p-8 shadow-[0_18px_60px_rgba(33,24,10,0.08)]'>
          <Search className='mx-auto h-10 w-10 text-[#b97822]' />
          <h1 className='mt-4 text-2xl font-extrabold text-[#101828]'>Checkout unavailable</h1>
          <p className='mt-3 text-sm leading-6 text-[#667085]'>
            This service is not currently available for booking. Choose another live marketplace service.
          </p>
          <Link href='/marketplace' className='mt-6 inline-flex rounded-lg bg-[#101828] px-5 py-2.5 text-sm font-bold text-white'>
            Browse marketplace
          </Link>
        </div>
      </div>
    )
  }

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
