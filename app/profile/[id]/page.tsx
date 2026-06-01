'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Briefcase, Clock3, Copy, Loader2, MapPin, MessageCircle, Search, ShieldCheck, Star, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase-client'
import { getOrCreateConversation } from '@/lib/messaging'
import { formatCurrency, formatResponseTime } from '@/lib/utils'

type ProfileUser = {
  id: string
  full_name: string | null
  avatar_url: string | null
  username: string | null
  profile_visibility: 'private' | 'marketplace' | 'public'
  role: 'buyer' | 'seller' | 'admin'
  created_at: string
}

type PublicProfile = {
  bio: string | null
  skills: string[] | null
  profile_photo_url: string | null
  rating: number | null
  reviews_count: number | null
}

type SellerProfile = {
  headline: string | null
  location: string | null
  response_time_minutes: number | null
  verification_status: string | null
  category_specializations: string[] | null
  portfolio_urls: string[] | null
}

type BuyerProfile = {
  organization_name: string | null
  buyer_type: string | null
  project_interests: string[] | null
}

type ProfileService = {
  id: string
  title: string
  slug: string | null
  category: string | null
  price: number
  media_url: string | null
}

type ProfileReview = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  buyer?: { full_name: string | null } | null
}

type RelatedCreator = {
  sellerId: string
  fullName: string | null
  avatarUrl: string | null
  username: string | null
  headline: string | null
  location: string | null
  rating: number
  reviewsCount: number
  serviceId: string
  serviceSlug: string | null
  serviceTitle: string
  category: string | null
}

function initials(name?: string | null) {
  return (name || 'KM')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [messageBusy, setMessageBusy] = useState(false)
  const [user, setUser] = useState<ProfileUser | null>(null)
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null)
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile | null>(null)
  const [services, setServices] = useState<ProfileService[]>([])
  const [reviews, setReviews] = useState<ProfileReview[]>([])
  const [relatedCreators, setRelatedCreators] = useState<RelatedCreator[]>([])

  useEffect(() => {
    const loadProfile = async () => {
      if (!params?.id) return

      setLoading(true)
      const [sessionResult, userResult, profileResult, sellerResult, buyerResult, servicesResult, reviewsResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('users')
          .select('id, full_name, avatar_url, username, profile_visibility, role, created_at')
          .eq('id', params.id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('bio, skills, profile_photo_url, rating, reviews_count')
          .eq('user_id', params.id)
          .maybeSingle(),
        supabase
          .from('seller_profiles')
          .select('headline, location, response_time_minutes, verification_status, category_specializations, portfolio_urls')
          .eq('user_id', params.id)
          .maybeSingle(),
        supabase
          .from('buyer_profiles')
          .select('organization_name, buyer_type, project_interests')
          .eq('user_id', params.id)
          .maybeSingle(),
        supabase
          .from('services')
          .select('id, title, slug, category, price, media_url')
          .eq('seller_id', params.id)
          .eq('is_active', true)
          .eq('moderation_status', 'active')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('reviews')
          .select('id, rating, comment, created_at, buyer:users!reviews_buyer_id_fkey(full_name)')
          .eq('seller_id', params.id)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(4),
      ])

      setCurrentUserId(sessionResult.data.user?.id || null)
      setUser((userResult.data as ProfileUser | null) || null)
      setProfile((profileResult.data as PublicProfile | null) || null)
      setSellerProfile((sellerResult.data as SellerProfile | null) || null)
      setBuyerProfile((buyerResult.data as BuyerProfile | null) || null)
      setServices((servicesResult.data as ProfileService[] | null) || [])
      setReviews((reviewsResult.data as unknown as ProfileReview[] | null) || [])

      const sellerServices = (servicesResult.data as ProfileService[] | null) || []
      const categories = Array.from(new Set(sellerServices.map((service) => service.category).filter(Boolean))) as string[]

      if (categories.length) {
        const { data: relatedData, error: relatedError } = await supabase
          .from('services')
          .select(`
            id,
            title,
            slug,
            category,
            seller_id,
            seller:users!services_seller_id_fkey(
              id,
              full_name,
              avatar_url,
              username,
              profile:profiles(rating, reviews_count),
              seller_profile:seller_profiles(headline, location)
            )
          `)
          .neq('seller_id', params.id)
          .eq('is_active', true)
          .eq('moderation_status', 'active')
          .in('category', categories)
          .order('created_at', { ascending: false })
          .limit(12)

        if (!relatedError) {
          const seen = new Set<string>()
          const related = ((relatedData || []) as any[])
            .map((item): RelatedCreator | null => {
              const seller = Array.isArray(item.seller) ? item.seller[0] : item.seller
              const publicProfile = Array.isArray(seller?.profile) ? seller.profile[0] : seller?.profile
              const publicSellerProfile = Array.isArray(seller?.seller_profile) ? seller.seller_profile[0] : seller?.seller_profile
              if (!seller?.id || seen.has(seller.id)) return null
              seen.add(seller.id)

              return {
                sellerId: seller.id,
                fullName: seller.full_name || 'Kingdom creator',
                avatarUrl: seller.avatar_url || null,
                username: seller.username || null,
                headline: publicSellerProfile?.headline || null,
                location: publicSellerProfile?.location || null,
                rating: Number(publicProfile?.rating || 0),
                reviewsCount: Number(publicProfile?.reviews_count || 0),
                serviceId: item.id,
                serviceSlug: item.slug || null,
                serviceTitle: item.title,
                category: item.category || null,
              } satisfies RelatedCreator
            })
            .filter((item): item is RelatedCreator => Boolean(item))
            .slice(0, 4)

          setRelatedCreators(related)
        } else {
          setRelatedCreators([])
        }
      } else {
        setRelatedCreators([])
      }

      setLoading(false)
    }

    void loadProfile()
  }, [params?.id, supabase])

  const messageProfile = async () => {
    if (!user || user.role !== 'seller') return

    setMessageBusy(true)
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push(`/login?next=${encodeURIComponent(`/profile/${user.id}`)}`)
        return
      }

      if (currentUser.id === user.id) throw new Error('This is your own profile')

      const conversationId = await getOrCreateConversation(supabase, {
        buyerId: currentUser.id,
        sellerId: user.id,
        serviceId: services[0]?.id || null,
      })

      toast.success('Conversation opened')
      router.push(`/dashboard/messages?conversation=${conversationId}`)
    } catch (error: any) {
      toast.error(error.message || 'Could not open conversation')
    } finally {
      setMessageBusy(false)
    }
  }

  const copyProfileLink = async () => {
    if (!user) return

    const path = user.username ? `/u/${user.username}` : `/profile/${user.id}`
    const href = `${window.location.origin}${path}`

    try {
      await navigator.clipboard.writeText(href)
      toast.success('Profile link copied')
    } catch {
      toast.error('Could not copy profile link')
    }
  }

  if (loading) {
    return (
      <div className='grid min-h-screen place-items-center bg-white'>
        <Loader2 className='h-8 w-8 animate-spin text-[#b97822]' />
      </div>
    )
  }

  if (!user) {
    return (
      <div className='grid min-h-screen place-items-center bg-white px-4 text-center'>
        <div className='max-w-md rounded-lg border border-[#eadfce] bg-white p-8 shadow-[0_18px_60px_rgba(33,24,10,0.08)]'>
          <Search className='mx-auto h-10 w-10 text-[#b97822]' />
          <h1 className='mt-4 text-2xl font-extrabold text-[#101828]'>Profile unavailable</h1>
          <p className='mt-3 text-sm leading-6 text-[#667085]'>
            This profile may be private, unavailable, or outside your marketplace conversations.
          </p>
          <Link href='/dashboard/messages' className='mt-6 inline-flex rounded-lg bg-[#101828] px-5 py-2.5 text-sm font-bold text-white'>
            Back to messages
          </Link>
        </div>
      </div>
    )
  }

  const displayName = user.full_name || 'Marketplace user'
  const heroImage = profile?.profile_photo_url || user.avatar_url
  const rating = Number(profile?.rating || 0)
  const reviewsCount = Number(profile?.reviews_count || reviews.length || 0)
  const specialties = sellerProfile?.category_specializations || buyerProfile?.project_interests || profile?.skills || []
  const canMessageProfile = user.role === 'seller' && currentUserId !== user.id
  const publicProfilePath = user.username ? `/u/${user.username}` : `/profile/${user.id}`

  return (
    <div className='min-h-screen bg-white px-3 py-4 sm:px-6 sm:py-8'>
      <div className='mx-auto max-w-6xl'>
        <Link href='/dashboard/messages' className='mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#8a5a18]'>
          <ArrowLeft className='h-4 w-4' />
          Back to messages
        </Link>

        <section className='overflow-hidden rounded-lg border border-[#eadfce] bg-[#fffdf8]'>
          <div className='grid gap-0 lg:grid-cols-[360px_minmax(0,1fr)]'>
            <div className='relative min-h-[280px] bg-[#f2eadc]'>
              {heroImage ? (
                <Image src={heroImage} alt={displayName} fill sizes='(min-width: 1024px) 360px, 100vw' className='object-cover' priority />
              ) : (
                <div className='grid h-full min-h-[280px] place-items-center text-5xl font-black text-[#8a5a18]'>
                  {initials(displayName)}
                </div>
              )}
            </div>

            <div className='p-5 sm:p-7'>
              <div className='flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between'>
                <div className='flex min-w-0 items-center gap-4'>
                  <Avatar src={user.avatar_url || undefined} fallback={initials(displayName)} className='h-16 w-16' />
                  <div className='min-w-0'>
                    <p className='text-sm font-bold capitalize text-[#8a5a18]'>{user.role}</p>
                    <h1 className='truncate text-3xl font-extrabold text-[#101828]'>{displayName}</h1>
                    <p className='mt-1 truncate text-sm text-[#667085]'>
                      {sellerProfile?.headline || buyerProfile?.organization_name || 'Kingdom marketplace member'}
                    </p>
                  </div>
                </div>
                <div className='flex shrink-0 items-center gap-2 rounded-lg border border-[#eadfce] bg-white px-3 py-2 text-sm font-bold'>
                  <Star className='h-4 w-4 fill-[#d8952f] text-[#d8952f]' />
                  {rating > 0 ? rating.toFixed(1) : 'New'}
                  <span className='text-[#98a2b3]'>({reviewsCount})</span>
                </div>
              </div>

              {canMessageProfile && (
                <div className='mt-5 flex flex-col gap-2 sm:flex-row'>
                  <Button
                    className='bg-[#101828] text-white hover:bg-[#1f2937]'
                    onClick={messageProfile}
                    disabled={messageBusy}
                  >
                    {messageBusy ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <MessageCircle className='mr-2 h-4 w-4' />}
                    Contact Seller
                  </Button>
                  <Button
                    variant='outline'
                    className='border-[#eadfce] bg-white text-[#101828]'
                    onClick={messageProfile}
                    disabled={messageBusy}
                  >
                    {messageBusy ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <MessageCircle className='mr-2 h-4 w-4' />}
                    Message Seller
                  </Button>
                  {!!services[0] && (
                    <Link href={`/listing/${services[0].slug || services[0].id}`}>
                      <Button variant='outline' className='w-full border-[#d8aa5e] bg-white text-[#8a5a18] sm:w-auto'>
                        Request Service
                      </Button>
                    </Link>
                  )}
                </div>
              )}

              {user.role === 'seller' && (
                <div className='mt-3 flex flex-col gap-2 sm:flex-row'>
                  <Button
                    variant='outline'
                    className='border-[#eadfce] bg-white text-[#101828]'
                    onClick={copyProfileLink}
                  >
                    <Copy className='mr-2 h-4 w-4' />
                    Copy profile link
                  </Button>
                  <Link href={publicProfilePath}>
                    <Button variant='outline' className='w-full border-[#d8aa5e] bg-white text-[#8a5a18] sm:w-auto'>
                      View public URL
                    </Button>
                  </Link>
                </div>
              )}

              <p className='mt-6 max-w-3xl whitespace-pre-line text-sm leading-6 text-[#4b5563]'>
                {profile?.bio || 'This member is building their marketplace profile.'}
              </p>

              <div className='mt-6 grid gap-3 sm:grid-cols-3'>
                <div className='rounded-lg border border-[#eadfce] bg-white p-4'>
                  <ShieldCheck className='h-5 w-5 text-[#15803d]' />
                  <p className='mt-2 text-sm font-extrabold capitalize'>{sellerProfile?.verification_status || 'Active'}</p>
                  <p className='mt-1 text-xs text-[#667085]'>Verification</p>
                </div>
                <div className='rounded-lg border border-[#eadfce] bg-white p-4'>
                  <Clock3 className='h-5 w-5 text-[#8a5a18]' />
                  <p className='mt-2 text-sm font-extrabold'>{formatResponseTime(sellerProfile?.response_time_minutes || null)}</p>
                  <p className='mt-1 text-xs text-[#667085]'>Response</p>
                </div>
                <div className='rounded-lg border border-[#eadfce] bg-white p-4'>
                  <MapPin className='h-5 w-5 text-[#8a5a18]' />
                  <p className='mt-2 truncate text-sm font-extrabold'>{sellerProfile?.location || buyerProfile?.buyer_type || 'Marketplace'}</p>
                  <p className='mt-1 text-xs text-[#667085]'>Context</p>
                </div>
              </div>

              {!!specialties.length && (
                <div className='mt-6 flex flex-wrap gap-2'>
                  {specialties.slice(0, 10).map((item) => (
                    <span key={item} className='rounded-full bg-white px-3 py-1 text-xs font-bold text-[#667085]'>
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className='mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]'>
          <div>
            <div className='mb-4 flex items-center gap-2'>
              <Briefcase className='h-5 w-5 text-[#8a5a18]' />
              <h2 className='text-2xl font-extrabold'>Services</h2>
            </div>
            {services.length ? (
              <div className='grid gap-4 sm:grid-cols-2'>
                {services.map((service) => (
                  <Link
                    key={service.id}
                    href={`/listing/${service.slug || service.id}`}
                    className='group overflow-hidden rounded-lg border border-[#eadfce] bg-[#fffdf8] transition hover:border-[#d8c4a7] hover:bg-white'
                  >
                    <div className='relative aspect-[16/10] bg-[#f2eadc]'>
                      {service.media_url ? (
                        <Image src={service.media_url} alt={service.title} fill sizes='(min-width: 640px) 50vw, 100vw' className='object-cover' />
                      ) : (
                        <div className='grid h-full place-items-center text-sm font-bold text-[#8a5a18]'>Service</div>
                      )}
                    </div>
                    <div className='p-4'>
                      <p className='text-xs font-bold text-[#8a5a18]'>{service.category || 'General'}</p>
                      <p className='mt-1 line-clamp-2 text-sm font-extrabold'>{service.title}</p>
                      <p className='mt-3 text-sm font-extrabold'>From {formatCurrency(service.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className='rounded-lg border border-dashed border-[#d8c9b5] bg-[#fffdf8] p-6 text-sm text-[#667085]'>
                No active public services are available for this profile yet.
              </div>
            )}
          </div>

          <aside className='h-fit rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
            <div className='flex items-center gap-2'>
              <MessageCircle className='h-5 w-5 text-[#8a5a18]' />
              <h2 className='text-xl font-extrabold'>Recent reviews</h2>
            </div>
            <div className='mt-4 space-y-3'>
              {reviews.length ? (
                reviews.map((review) => (
                  <div key={review.id} className='rounded-lg border border-[#eadfce] bg-white p-4'>
                    <div className='flex items-center justify-between gap-3'>
                      <p className='truncate text-sm font-extrabold'>{review.buyer?.full_name || 'Buyer'}</p>
                      <span className='flex items-center gap-1 text-xs font-bold'>
                        <Star className='h-3.5 w-3.5 fill-[#d8952f] text-[#d8952f]' />
                        {review.rating}
                      </span>
                    </div>
                    <p className='mt-2 line-clamp-4 text-sm leading-6 text-[#5b6472]'>
                      {review.comment || 'Great work and clear communication.'}
                    </p>
                  </div>
                ))
              ) : (
                <p className='rounded-lg border border-dashed border-[#d8c9b5] bg-white p-4 text-sm leading-6 text-[#667085]'>
                  Reviews from completed orders will appear here.
                </p>
              )}
            </div>
          </aside>
        </section>

        {!!relatedCreators.length && (
          <section className='mt-8'>
            <div className='mb-4 flex items-center gap-2'>
              <Users className='h-5 w-5 text-[#8a5a18]' />
              <h2 className='text-2xl font-extrabold'>Related creators</h2>
            </div>
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
              {relatedCreators.map((creator) => {
                const profileHref = creator.username ? `/u/${creator.username}` : `/profile/${creator.sellerId}`
                const serviceHref = `/listing/${creator.serviceSlug || creator.serviceId}`
                const creatorInitials = initials(creator.fullName)

                return (
                  <div key={creator.sellerId} className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-4'>
                    <div className='flex items-center gap-3'>
                      <Avatar src={creator.avatarUrl || undefined} fallback={creatorInitials} className='h-12 w-12' />
                      <div className='min-w-0'>
                        <Link href={profileHref} className='block truncate text-sm font-extrabold text-[#101828] hover:text-[#8a5a18]'>
                          {creator.fullName || 'Kingdom creator'}
                        </Link>
                        <p className='truncate text-xs text-[#667085]'>{creator.headline || creator.category || 'Marketplace creator'}</p>
                      </div>
                    </div>
                    <div className='mt-3 flex items-center justify-between gap-2 text-xs text-[#667085]'>
                      <span className='flex items-center gap-1 font-bold text-[#101828]'>
                        <Star className='h-3.5 w-3.5 fill-[#d8952f] text-[#d8952f]' />
                        {creator.rating && creator.rating > 0 ? creator.rating.toFixed(1) : 'New'}
                      </span>
                      <span className='truncate'>{creator.location || creator.category || 'Marketplace'}</span>
                    </div>
                    <Link href={serviceHref} className='mt-3 block line-clamp-2 text-xs font-bold leading-5 text-[#8a5a18]'>
                      {creator.serviceTitle}
                    </Link>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
