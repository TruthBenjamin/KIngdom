import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Clock3, MessageCircle, ShieldCheck, Star } from 'lucide-react'
import { ServiceActions } from '@/components/marketplace/service-actions'
import { createPublicServerClient } from '@/lib/supabase-public'
import { getMarketplaceServiceBySlug, getRelatedMarketplaceServices } from '@/domains/marketplace'
import { formatCurrency } from '@/lib/utils'
import { ServiceCard } from '@/components/marketplace/service-card'

export const dynamic = 'force-dynamic'

const fallbackImage =
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&h=900&fit=crop'

export default async function ListingPage({ params }: { params: { id: string } }) {
  const supabase = createPublicServerClient()
  const service = await getMarketplaceServiceBySlug(supabase, params.id)

  if (!service) notFound()

  const [related, reviewsResult] = await Promise.all([
    getRelatedMarketplaceServices(supabase, service, 3),
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, buyer:users!reviews_buyer_id_fkey(full_name, avatar_url)')
      .eq('service_id', service.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(4),
  ])
  const reviews = (reviewsResult.data || []) as unknown as {
    id: string
    rating: number
    comment: string | null
    created_at: string
    buyer: { full_name: string | null; avatar_url: string | null } | null
  }[]
  const rating = service.seller.rating > 0 ? service.seller.rating.toFixed(1) : 'New'

  return (
    <div className='min-h-screen bg-[#f7f3ec] px-3 py-4 sm:px-6 sm:py-8 content-fade-in'>
      <div className='mx-auto max-w-6xl'>
        <Link href='/marketplace' className='mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#8a5a18]'>
          <ArrowLeft className='h-4 w-4' />
          Back to marketplace
        </Link>

        <div className='grid gap-5 lg:grid-cols-[1fr_380px]'>
          <main className='overflow-hidden rounded-lg border border-[#eadfce] bg-white'>
            <div className='relative aspect-[4/3] bg-[#f2eadc] sm:aspect-[16/10]'>
              <Image
                src={service.mediaUrl || fallbackImage}
                alt={service.title}
                fill
                priority
                sizes='(min-width: 1024px) 720px, 100vw'
                className='object-cover'
              />
            </div>
            <div className='p-5 sm:p-7'>
              <p className='text-sm font-bold text-[#a36d1b]'>{service.category}</p>
              <h1 className='mt-2 text-3xl font-extrabold leading-tight text-[#101828] sm:text-4xl'>
                {service.title}
              </h1>
              <div className='mt-4 flex flex-wrap items-center gap-3 text-sm text-[#667085]'>
                <span className='flex items-center gap-1 font-bold text-[#101828]'>
                  <Star className='h-4 w-4 fill-[#d8952f] text-[#d8952f]' />
                  {rating}
                </span>
                <span>{service.seller.reviewsCount} reviews</span>
                <span className='flex items-center gap-1'>
                  <Clock3 className='h-4 w-4' />
                  {service.deliveryDays} day delivery
                </span>
                <span>{service.revisionCount} revisions</span>
              </div>

              <section className='mt-8'>
                <h2 className='text-xl font-extrabold'>About this service</h2>
                <p className='mt-3 whitespace-pre-line text-base leading-7 text-[#4b5563]'>{service.description}</p>
              </section>

              {service.requirements && (
                <section className='mt-8 rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
                  <h2 className='text-lg font-extrabold'>What the seller needs from you</h2>
                  <p className='mt-3 whitespace-pre-line text-sm leading-6 text-[#5b6472]'>{service.requirements}</p>
                </section>
              )}

              <section className='mt-8 grid gap-3 sm:grid-cols-3'>
                {[
                  'Escrow-backed order lifecycle',
                  'Messaging tied to the service',
                  'Delivery and revision tracking',
                ].map((item) => (
                  <div key={item} className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-4'>
                    <CheckCircle2 className='h-5 w-5 text-[#15803d]' />
                    <p className='mt-3 text-sm font-bold'>{item}</p>
                  </div>
                ))}
              </section>

              <section className='mt-8'>
                <div className='mb-4 flex items-end justify-between gap-3'>
                  <div>
                    <h2 className='text-xl font-extrabold'>Recent reviews</h2>
                    <p className='mt-1 text-sm text-[#667085]'>Verified buyer feedback from completed orders for this service.</p>
                  </div>
                  <div className='hidden items-center gap-1 rounded-full bg-[#fffdf8] px-3 py-1 text-sm font-bold sm:flex'>
                    <Star className='h-4 w-4 fill-[#d8952f] text-[#d8952f]' />
                    {rating}
                  </div>
                </div>
                {reviews.length ? (
                  <div className='grid gap-3 sm:grid-cols-2'>
                    {reviews.map((review) => (
                      <div key={review.id} className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-4'>
                        <div className='mb-2 flex items-center justify-between gap-3'>
                          <p className='truncate text-sm font-extrabold'>{review.buyer?.full_name || 'Buyer'}</p>
                          <span className='flex items-center gap-1 text-xs font-bold'>
                            <Star className='h-3.5 w-3.5 fill-[#d8952f] text-[#d8952f]' />
                            {review.rating}
                          </span>
                        </div>
                        <p className='line-clamp-4 text-sm leading-6 text-[#5b6472]'>{review.comment || 'Great work and clear communication.'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='rounded-lg border border-dashed border-[#d8c9b5] bg-[#fffdf8] p-6 text-sm text-[#667085]'>
                    Reviews will appear here once completed orders receive buyer feedback.
                  </div>
                )}
              </section>
            </div>
          </main>

          <aside className='h-fit rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5 shadow-[0_18px_60px_rgba(33,24,10,0.08)] sm:p-6'>
            <div className='flex items-center gap-4'>
              <div className='relative h-16 w-16 overflow-hidden rounded-full bg-[#f2eadc]'>
                {service.seller.avatarUrl ? (
                  <Image src={service.seller.avatarUrl} alt={service.seller.fullName} fill sizes='64px' className='object-cover' />
                ) : (
                  <div className='grid h-full w-full place-items-center text-lg font-black text-[#8a5a18]'>
                    {service.seller.fullName.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className='min-w-0'>
                <h2 className='truncate text-xl font-extrabold'>{service.seller.fullName}</h2>
                <p className='truncate text-sm text-[#667085]'>{service.seller.headline || 'Kingdom creator'}</p>
              </div>
            </div>

            <div className='my-6 rounded-lg border border-[#eadfce] bg-white p-4'>
              <div className='flex items-end justify-between gap-3'>
                <div>
                  <p className='text-xs font-bold uppercase tracking-wide text-[#667085]'>Starting at</p>
                  <p className='mt-1 text-3xl font-extrabold'>{formatCurrency(service.price)}</p>
                </div>
                <ShieldCheck className='h-7 w-7 text-[#15803d]' />
              </div>
              <p className='mt-3 text-sm leading-6 text-[#667085]'>
                Create a protected marketplace workflow, or message the creator to confirm scope before booking.
              </p>
            </div>

            <div className='mb-4 rounded-lg border border-[#eadfce] bg-white p-4'>
              <div className='flex items-center gap-2 text-sm font-extrabold'>
                <MessageCircle className='h-4 w-4 text-[#8a5a18]' />
                Before you book
              </div>
              <p className='mt-2 text-sm leading-6 text-[#667085]'>
                Send a short brief, confirm timeline, then book when scope is clear.
              </p>
            </div>

            <ServiceActions
              serviceId={service.id}
              sellerId={service.sellerId}
              price={service.price}
            />

            <div className='mt-6 grid grid-cols-3 gap-3 border-t border-[#eadfce] pt-5 text-center'>
              {[
                [rating, 'Rating'],
                [`${service.seller.reviewsCount}`, 'Reviews'],
                [service.seller.responseTimeMinutes ? `${service.seller.responseTimeMinutes}m` : 'Soon', 'Response'],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className='font-extrabold'>{value}</p>
                  <p className='mt-1 text-[10px] text-[#667085]'>{label}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>

        {!!related.length && (
          <section className='mt-8'>
            <div className='mb-4 flex items-end justify-between gap-3'>
              <div>
                <h2 className='text-2xl font-extrabold'>Related services</h2>
                <p className='mt-1 text-sm text-[#667085]'>Same-category and tag-based suggestions from live services.</p>
              </div>
              <Link href={`/marketplace/${service.categorySlug}`} className='text-sm font-bold text-[#8a5a18]'>
                View category
              </Link>
            </div>
            <div className='grid gap-5 md:grid-cols-3'>
              {related.map((item) => (
                <ServiceCard key={item.id} service={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
