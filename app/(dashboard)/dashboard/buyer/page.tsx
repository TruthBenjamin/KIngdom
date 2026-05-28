'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Heart, Loader2, MessageCircle, Search, Settings } from 'lucide-react'
import Link from 'next/link'
import { useCurrentUser } from '@/hooks/use-current-user'
import { formatCurrency } from '@/lib/utils'

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
  const [recentlyViewedCount, setRecentlyViewedCount] = useState(0)

  const loadStats = useCallback(async () => {
    if (!user) return

    setStatsLoading(true)
    const [savedResult, chatResult, orderResult, spendResult, savedListResult] = await Promise.all([
      supabase.from('saved_services').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('buyer_id', user.id).eq('status', 'active'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('buyer_id', user.id).eq('order_status', 'COMPLETED'),
      supabase.from('orders').select('amount').eq('buyer_id', user.id).in('order_status', ['ACTIVE', 'DELIVERED', 'COMPLETED']),
      supabase
        .from('saved_services')
        .select('service:services(id, title, slug, price, category, seller:users!services_seller_id_fkey(full_name))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(4),
    ])

    setStats({
      savedServices: savedResult.count || 0,
      activeChats: chatResult.count || 0,
      completedOrders: orderResult.count || 0,
      totalSpent: (spendResult.data || []).reduce((sum, order) => sum + Number(order.amount || 0), 0),
    })
    setSavedServices(
      ((savedListResult.data || []) as unknown as { service: SavedService | SavedService[] | null }[])
        .map((row) => (Array.isArray(row.service) ? row.service[0] : row.service))
        .filter((service): service is SavedService => Boolean(service))
    )
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

  const metrics = useMemo(
    () => [
      { label: 'Saved Services', value: stats.savedServices.toString(), color: 'bg-[#193b8c]' },
      { label: 'Active Chats', value: stats.activeChats.toString(), color: 'bg-[#15803d]' },
      { label: 'Completed Orders', value: stats.completedOrders.toString(), color: 'bg-[#7c3aed]' },
      { label: 'Total Spent', value: formatCurrency(stats.totalSpent), color: 'bg-[#d8952f]' },
      { label: 'Recently Viewed', value: recentlyViewedCount.toString(), color: 'bg-[#0f766e]' },
    ],
    [recentlyViewedCount, stats]
  )

  if (loading || !user) {
    return (
      <div className='grid min-h-screen place-items-center'>
        <Loader2 className='h-8 w-8 animate-spin text-[#b97822]' />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#f7f3ec] py-8 sm:py-12 content-fade-in'>
      <div className='container mx-auto px-4'>
        <div className='mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h1 className='text-4xl font-extrabold tracking-tight'>Buyer dashboard</h1>
            <p className='mt-2 text-muted-foreground'>Track your marketplace activity, conversations, and orders.</p>
          </div>
          <Link href='/marketplace'>
            <Button className='bg-[#101828] text-white hover:bg-[#1f2937]'>
              <Search className='mr-2 h-4 w-4' />
              Browse services
            </Button>
          </Link>
        </div>

        <div className='mb-8 grid gap-6 md:grid-cols-5'>
          {metrics.map((stat) => (
            <Card key={stat.label} className='border-[#eadfce] bg-[#fffdf8] transition hover:bg-white hover:shadow-sm'>
              <CardContent className='p-6'>
                <div className={`mb-3 h-3 w-3 rounded-full ${stat.color}`} />
                <p className='text-sm text-muted-foreground'>{stat.label}</p>
                <p className='text-2xl font-bold'>{statsLoading ? '...' : stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className='mb-8 grid gap-6 md:grid-cols-4'>
          {[
            {
              title: 'Saved Services',
              description: 'Return to services you are considering',
              icon: Heart,
              href: '/dashboard/buyer/saved',
              label: 'Browse saved',
            },
            {
              title: 'Conversations',
              description: 'Chat with creators and sellers',
              icon: MessageCircle,
              href: '/dashboard/messages',
              label: 'View chats',
            },
            {
              title: 'Settings',
              description: 'Update your profile and preferences',
              icon: Settings,
              href: '/dashboard/buyer/settings',
              label: 'Settings',
            },
            {
              title: 'Payments',
              description: 'Track protected workflows and beta payment activity',
              icon: CreditCard,
              href: '/dashboard/payments',
              label: 'View payments',
            },
          ].map(({ title, description, icon: Icon, href, label }) => (
            <Card key={title} className='border-[#eadfce] transition hover:-translate-y-0.5 hover:shadow-sm'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Icon className='h-5 w-5' />
                  {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={href}>
                  <Button className='w-full'>{label}</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className='mb-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]'>
          <Card className='border-[#eadfce]'>
            <CardHeader>
              <CardTitle>Saved services</CardTitle>
              <CardDescription>Services are loaded from your saved_services records.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {savedServices.map((service) => (
                  <Link
                    key={service.id}
                    href={`/listing/${service.slug || service.id}`}
                    className='flex items-center justify-between gap-4 rounded-lg border border-[#eadfce] bg-[#fffdf8] p-4 transition hover:bg-white'
                  >
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-bold'>{service.title}</p>
                      <p className='mt-1 truncate text-xs text-[#667085]'>
                        {service.category} by {service.seller?.full_name || 'Kingdom seller'}
                      </p>
                    </div>
                    <p className='shrink-0 text-sm font-extrabold'>{formatCurrency(service.price)}</p>
                  </Link>
                ))}
                {!savedServices.length && (
                  <div className='rounded-lg border border-dashed border-[#d8c9b5] bg-[#fffdf8] p-8 text-center text-sm text-[#667085]'>
                    Save services from marketplace pages and they will appear here.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className='border-[#eadfce]'>
            <CardHeader>
              <CardTitle>Profile completion</CardTitle>
              <CardDescription>Buyer onboarding helps sellers respond with better scopes and timelines.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href='/dashboard/buyer/settings'>
                <Button className='w-full bg-[#101828] text-white hover:bg-[#1f2937]'>Complete buyer profile</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className='border-[#eadfce]'>
          <CardHeader>
            <CardTitle>Recommended next step</CardTitle>
            <CardDescription>
              Browse services, save promising options, or message a creator to confirm scope before booking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href='/marketplace'>
              <Button className='w-full bg-[#101828] text-white hover:bg-[#1f2937]'>Find a creator</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
