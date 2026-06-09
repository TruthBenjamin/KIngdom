'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Heart,
  MessageCircle,
  Search,
  Settings,
  Sparkles,
  Star,
  UserCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentUser } from '@/hooks/use-current-user'
import { serviceListingHref } from '@/lib/navigation'
import { formatCurrency, formatTimeAgo } from '@/lib/utils'

type BuyerStats = {
  savedServices: number
  activeChats: number
  completedOrders: number
  totalSpent: number
}

type SavedService = {
  id: string
  title: string
  slug: string | null
  price: number
  category: string
  seller?: { full_name: string | null } | null
}

type ReviewableOrder = {
  id: string
  title: string
  seller_id: string
  service_id: string
  accepted_at: string | null
  updated_at: string
  seller?: { full_name: string | null; avatar_url: string | null } | null
  service?: { title: string | null; slug: string | null } | null
}

function initials(name?: string | null) {
  return (name || 'KM')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'KM'
}

export default function BuyerDashboard() {
  const router = useRouter()
  const { user, loading, supabase } = useCurrentUser()
  const [stats, setStats] = useState<BuyerStats>({
    savedServices: 0,
    activeChats: 0,
    completedOrders: 0,
    totalSpent: 0,
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [savedServices, setSavedServices] = useState<SavedService[]>([])
  const [reviewableOrders, setReviewableOrders] = useState<ReviewableOrder[]>([])
  const [recentlyViewedCount, setRecentlyViewedCount] = useState(0)

  const loadStats = useCallback(async () => {
    if (!user) return

    setStatsLoading(true)
    const [summaryResult, completedOrdersResult, reviewsResult] = await Promise.all([
      supabase.rpc('get_buyer_dashboard_summary', { result_limit: 4 }),
      supabase
        .from('orders')
        .select('id, title, seller_id, service_id, accepted_at, updated_at, seller:users!orders_seller_id_fkey(full_name, avatar_url), service:services(title, slug)')
        .eq('buyer_id', user.id)
        .eq('order_status', 'COMPLETED')
        .order('updated_at', { ascending: false })
        .limit(8),
      supabase.from('reviews').select('order_id').eq('buyer_id', user.id),
    ])

    if (summaryResult.error) {
      toast.error('Could not load buyer dashboard')
      setStatsLoading(false)
      return
    }

    const summary = summaryResult.data?.[0]
    const reviewedOrderIds = new Set((reviewsResult.data || []).map((review) => review.order_id).filter(Boolean))
    const pendingReviews = ((completedOrdersResult.data || []) as unknown as ReviewableOrder[])
      .filter((order) => !reviewedOrderIds.has(order.id))
      .slice(0, 3)

    setStats({
      savedServices: summary?.saved_services_count || 0,
      activeChats: summary?.active_chats_count || 0,
      completedOrders: summary?.completed_orders_count || 0,
      totalSpent: summary?.total_spent || 0,
    })
    setSavedServices(Array.isArray(summary?.saved_services) ? (summary.saved_services as unknown as SavedService[]) : [])
    setReviewableOrders(pendingReviews)

    if (typeof window !== 'undefined') {
      const viewed = JSON.parse(window.localStorage.getItem('recentlyViewedServices') || '[]') as string[]
      setRecentlyViewedCount(viewed.length)
    }

    setStatsLoading(false)
  }, [supabase, user])

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, router, user])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  const profileCompletion = useMemo(() => {
    let score = 25
    if (user?.fullName) score += 25
    if (user?.avatarUrl) score += 20
    if (stats.savedServices > 0) score += 15
    if (stats.activeChats > 0) score += 15
    return Math.min(score, 100)
  }, [stats.activeChats, stats.savedServices, user?.avatarUrl, user?.fullName])

  const metrics = useMemo(
    () => [
      { label: 'Saved', value: stats.savedServices.toString(), detail: 'Services shortlisted', icon: Heart, tone: 'text-[#b42318] bg-[#fff1f2]' },
      { label: 'Chats', value: stats.activeChats.toString(), detail: 'Active conversations', icon: MessageCircle, tone: 'text-[#047857] bg-[#ecfdf3]' },
      { label: 'Completed', value: stats.completedOrders.toString(), detail: 'Finished orders', icon: CheckCircle2, tone: 'text-[#175cd3] bg-[#eff8ff]' },
      { label: 'Spent', value: formatCurrency(stats.totalSpent), detail: 'Tracked beta spend', icon: CreditCard, tone: 'text-[#8a5a18] bg-[#fff8ea]' },
    ],
    [stats]
  )

  if (loading || !user) {
    return (
      <div className='min-h-screen bg-[#f8fafc] px-3 py-4 sm:px-6 sm:py-8'>
        <div className='mx-auto max-w-7xl'>
          <Skeleton className='h-44 w-full rounded-lg' />
          <div className='mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className='h-28 w-full rounded-lg' />
            ))}
          </div>
          <div className='mt-5 grid gap-5 lg:grid-cols-[1fr_360px]'>
            <Skeleton className='h-96 w-full rounded-lg' />
            <Skeleton className='h-96 w-full rounded-lg' />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#f8fafc] px-3 py-4 sm:px-6 sm:py-8 content-fade-in'>
      <div className='mx-auto max-w-7xl'>
        <section className='overflow-hidden rounded-lg border border-[#d8c9b5] bg-white shadow-[0_18px_60px_rgba(33,24,10,0.08)]'>
          <div className='grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]'>
            <div className='p-5 sm:p-7'>
              <div className='flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between'>
                <div className='min-w-0'>
                  <p className='text-xs font-extrabold uppercase tracking-[0.18em] text-[#8a5a18]'>Buyer workspace</p>
                  <h1 className='mt-2 text-3xl font-extrabold tracking-tight text-[#101828] sm:text-4xl'>
                    Welcome back, {user.fullName || 'Kingdom buyer'}
                  </h1>
                  <p className='mt-3 max-w-2xl text-sm leading-6 text-[#667085]'>
                    Compare services, keep conversations moving, and review completed work from one calm dashboard.
                  </p>
                </div>
                <div className='flex gap-2'>
                  <Link href='/marketplace'>
                    <Button className='bg-[#101828] text-white hover:bg-[#1f2937]'>
                      <Search className='mr-2 h-4 w-4' />
                      Browse
                    </Button>
                  </Link>
                  <Link href='/dashboard/messages'>
                    <Button variant='outline' className='border-[#d8c9b5] bg-white'>
                      <MessageCircle className='mr-2 h-4 w-4' />
                      Inbox
                    </Button>
                  </Link>
                </div>
              </div>

              <div className='mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                {metrics.map(({ label, value, detail, icon: Icon, tone }) => (
                  <div key={label} className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-4'>
                    <div className={`mb-4 grid h-9 w-9 place-items-center rounded-md ${tone}`}>
                      <Icon className='h-4 w-4' />
                    </div>
                    <p className='text-xs font-bold text-[#667085]'>{label}</p>
                    {statsLoading ? <Skeleton className='mt-2 h-8 w-20' /> : <p className='mt-1 text-2xl font-extrabold'>{value}</p>}
                    <p className='mt-1 text-xs text-[#667085]'>{detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className='border-t border-[#eadfce] bg-[#fffdf8] p-5 sm:p-7 lg:border-l lg:border-t-0'>
              <div className='flex items-center gap-3'>
                <Avatar src={user.avatarUrl || undefined} fallback={initials(user.fullName || user.email)} className='h-14 w-14 bg-[#f0c56a] text-[#06172f]' />
                <div className='min-w-0'>
                  <p className='truncate text-sm font-extrabold'>{user.fullName || user.email}</p>
                  <p className='text-xs font-bold uppercase tracking-wide text-[#98a2b3]'>{user.role}</p>
                </div>
              </div>
              <div className='mt-5'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='font-bold'>Profile readiness</span>
                  <span className='font-extrabold'>{profileCompletion}%</span>
                </div>
                <div className='mt-2 h-2 overflow-hidden rounded-full bg-[#eadfce]'>
                  <div className='h-full bg-[#15803d]' style={{ width: `${profileCompletion}%` }} />
                </div>
              </div>
              <div className='mt-5 grid gap-2'>
                <Link href='/dashboard/buyer/settings'>
                  <Button variant='outline' className='w-full justify-start border-[#eadfce] bg-white'>
                    <Settings className='mr-2 h-4 w-4' />
                    Profile settings
                  </Button>
                </Link>
                <Link href='/dashboard/payments'>
                  <Button variant='outline' className='w-full justify-start border-[#eadfce] bg-white'>
                    <CreditCard className='mr-2 h-4 w-4' />
                    Orders and payments
                  </Button>
                </Link>
              </div>
            </aside>
          </div>
        </section>

        <div className='mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]'>
          <main className='space-y-6'>
            <section className='rounded-lg border border-[#d8c9b5] bg-white p-5 shadow-[0_14px_40px_rgba(33,24,10,0.06)] sm:p-6'>
              <div className='mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
                <div>
                  <h2 className='text-xl font-extrabold'>Saved services</h2>
                  <p className='mt-1 text-sm text-[#667085]'>Your shortlist for comparison and booking.</p>
                </div>
                <Link href='/dashboard/buyer/saved' className='text-sm font-bold text-[#8a5a18]'>
                  View all
                </Link>
              </div>
              <div className='grid gap-3'>
                {savedServices.map((service) => (
                  <Link
                    key={service.id}
                    href={serviceListingHref(service)}
                    className='group flex items-center justify-between gap-4 rounded-lg border border-[#eadfce] bg-[#fffdf8] p-4 transition hover:border-[#d8c4a7] hover:bg-white'
                  >
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-extrabold group-hover:text-[#8a5a18]'>{service.title}</p>
                      <p className='mt-1 truncate text-xs text-[#667085]'>
                        {service.category} by {service.seller?.full_name || 'Kingdom seller'}
                      </p>
                    </div>
                    <div className='flex shrink-0 items-center gap-3'>
                      <p className='text-sm font-extrabold'>{formatCurrency(service.price)}</p>
                      <ArrowRight className='h-4 w-4 text-[#98a2b3] group-hover:text-[#8a5a18]' />
                    </div>
                  </Link>
                ))}
                {!savedServices.length && (
                  <div className='rounded-lg border border-dashed border-[#d8c9b5] bg-[#fffdf8] p-8 text-center'>
                    <Heart className='mx-auto h-8 w-8 text-[#b97822]' />
                    <p className='mt-3 text-sm font-extrabold'>No saved services yet</p>
                    <p className='mt-1 text-sm text-[#667085]'>Save services while browsing and they will appear here.</p>
                    <Link href='/marketplace'>
                      <Button className='mt-4 bg-[#101828] text-white hover:bg-[#1f2937]'>Browse services</Button>
                    </Link>
                  </div>
                )}
              </div>
            </section>

            <section className='rounded-lg border border-[#d8c9b5] bg-white p-5 shadow-[0_14px_40px_rgba(33,24,10,0.06)] sm:p-6'>
              <div className='mb-5 flex items-start justify-between gap-3'>
                <div>
                  <h2 className='text-xl font-extrabold'>Ready for review</h2>
                  <p className='mt-1 text-sm text-[#667085]'>Completed orders that still need buyer feedback.</p>
                </div>
                <div className='rounded-full bg-[#fff8ea] px-3 py-1 text-xs font-extrabold text-[#8a5a18]'>
                  {reviewableOrders.length}
                </div>
              </div>
              <div className='grid gap-3'>
                {reviewableOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/dashboard/orders/${order.id}`}
                    className='flex items-center gap-3 rounded-lg border border-[#eadfce] bg-[#fffdf8] p-4 transition hover:bg-white'
                  >
                    <Avatar src={order.seller?.avatar_url || undefined} fallback={initials(order.seller?.full_name)} className='h-10 w-10' />
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-extrabold'>{order.service?.title || order.title}</p>
                      <p className='mt-1 text-xs text-[#667085]'>
                        {order.seller?.full_name || 'Seller'} - completed {formatTimeAgo(order.accepted_at || order.updated_at)}
                      </p>
                    </div>
                    <Star className='h-4 w-4 text-[#d8952f]' />
                  </Link>
                ))}
                {!reviewableOrders.length && (
                  <div className='rounded-lg border border-dashed border-[#d8c9b5] bg-[#fffdf8] p-6 text-center text-sm text-[#667085]'>
                    Completed orders that need feedback will appear here.
                  </div>
                )}
              </div>
            </section>
          </main>

          <aside className='space-y-6'>
            <section className='rounded-lg border border-[#d8c9b5] bg-white p-5 shadow-[0_14px_40px_rgba(33,24,10,0.06)]'>
              <h2 className='text-lg font-extrabold'>Next best action</h2>
              <p className='mt-2 text-sm leading-6 text-[#667085]'>
                Use your saved list to compare sellers, or start a conversation before booking.
              </p>
              <div className='mt-4 grid gap-2'>
                <Link href='/marketplace'>
                  <Button className='w-full justify-start bg-[#101828] text-white hover:bg-[#1f2937]'>
                    <Sparkles className='mr-2 h-4 w-4' />
                    Discover creators
                  </Button>
                </Link>
                <Link href='/dashboard/messages'>
                  <Button variant='outline' className='w-full justify-start border-[#eadfce] bg-[#fffdf8]'>
                    <MessageCircle className='mr-2 h-4 w-4' />
                    Continue chats
                  </Button>
                </Link>
              </div>
            </section>

            <section className='rounded-lg border border-[#d8c9b5] bg-white p-5 shadow-[0_14px_40px_rgba(33,24,10,0.06)]'>
              <h2 className='text-lg font-extrabold'>Activity signals</h2>
              <div className='mt-4 grid gap-3 text-sm'>
                <div className='flex items-center justify-between rounded-md bg-[#fffdf8] px-3 py-2'>
                  <span className='text-[#667085]'>Recently viewed</span>
                  <b>{recentlyViewedCount}</b>
                </div>
                <div className='flex items-center justify-between rounded-md bg-[#fffdf8] px-3 py-2'>
                  <span className='text-[#667085]'>Profile state</span>
                  <b>{profileCompletion >= 80 ? 'Strong' : 'Needs detail'}</b>
                </div>
                <div className='flex items-center justify-between rounded-md bg-[#fffdf8] px-3 py-2'>
                  <span className='text-[#667085]'>Account</span>
                  <b className='capitalize'>{user.role}</b>
                </div>
              </div>
            </section>

            <section className='rounded-lg border border-[#d8c9b5] bg-white p-5 shadow-[0_14px_40px_rgba(33,24,10,0.06)]'>
              <div className='flex items-center gap-2'>
                <UserCircle className='h-5 w-5 text-[#8a5a18]' />
                <h2 className='text-lg font-extrabold'>Buyer profile</h2>
              </div>
              <p className='mt-2 text-sm leading-6 text-[#667085]'>
                Keep your organization, interests, brief, and profile photo current so sellers can respond faster.
              </p>
              <Link href='/dashboard/buyer/settings'>
                <Button variant='outline' className='mt-4 w-full border-[#eadfce] bg-[#fffdf8]'>
                  Edit profile
                </Button>
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
