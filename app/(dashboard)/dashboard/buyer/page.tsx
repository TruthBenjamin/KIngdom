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

  const loadStats = useCallback(async () => {
    if (!user) return

    setStatsLoading(true)
    const [savedResult, chatResult, orderResult, spendResult] = await Promise.all([
      supabase.from('saved_services').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('buyer_id', user.id).eq('status', 'active'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('buyer_id', user.id).eq('order_status', 'COMPLETED'),
      supabase.from('orders').select('amount').eq('buyer_id', user.id).in('order_status', ['ACTIVE', 'DELIVERED', 'COMPLETED']),
    ])

    setStats({
      savedServices: savedResult.count || 0,
      activeChats: chatResult.count || 0,
      completedOrders: orderResult.count || 0,
      totalSpent: (spendResult.data || []).reduce((sum, order) => sum + Number(order.amount || 0), 0),
    })
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
    ],
    [stats]
  )

  if (loading || !user) {
    return (
      <div className='grid min-h-screen place-items-center'>
        <Loader2 className='h-8 w-8 animate-spin text-[#b97822]' />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#f7f3ec] py-8 sm:py-12'>
      <div className='container mx-auto px-4'>
        <div className='mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h1 className='text-4xl font-bold'>Buyer dashboard</h1>
            <p className='mt-2 text-muted-foreground'>Track your marketplace activity, conversations, and orders.</p>
          </div>
          <Link href='/marketplace'>
            <Button className='bg-[#101828] text-white hover:bg-[#1f2937]'>
              <Search className='mr-2 h-4 w-4' />
              Browse services
            </Button>
          </Link>
        </div>

        <div className='mb-8 grid gap-6 md:grid-cols-4'>
          {metrics.map((stat) => (
            <Card key={stat.label} className='border-[#eadfce]'>
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
              href: '/marketplace',
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
              description: 'Track escrow orders and wallet activity',
              icon: CreditCard,
              href: '/dashboard/payments',
              label: 'View payments',
            },
          ].map(({ title, description, icon: Icon, href, label }) => (
            <Card key={title} className='border-[#eadfce]'>
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

        <Card className='border-[#eadfce]'>
          <CardHeader>
            <CardTitle>Next marketplace step</CardTitle>
            <CardDescription>
              A real buyer dashboard should surface orders that need approval, unread messages, and saved services that match current needs.
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
