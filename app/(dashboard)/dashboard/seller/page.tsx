'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Briefcase,
  CalendarCheck,
  CreditCard,
  Home,
  Loader2,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Star,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/hooks/use-current-user'
import { formatCurrency, formatTimeAgo } from '@/lib/utils'

type SellerOrder = {
  id: string
  title: string
  amount: number
  order_status: string
  created_at: string
}

type SellerService = {
  id: string
  title: string
  price: number
  status: string
  is_active: boolean
}

type SellerStats = {
  available: number
  pending: number
  activeOrders: number
  completedOrders: number
  services: number
}

const menu = [
  { label: 'Dashboard', icon: Home, active: true, href: '/dashboard/seller' },
  { label: 'Services', icon: Briefcase, href: '/dashboard/seller' },
  { label: 'Orders', icon: CalendarCheck, href: '/dashboard/payments' },
  { label: 'Messages', icon: MessageCircle, href: '/dashboard/messages' },
  { label: 'Reviews', icon: Star, href: '/dashboard/seller' },
  { label: 'Earnings', icon: CreditCard, href: '/dashboard/payments' },
  { label: 'Profile', icon: User, href: '/dashboard/seller' },
]

export default function SellerDashboard() {
  const router = useRouter()
  const { user, loading, supabase } = useCurrentUser()
  const [stats, setStats] = useState<SellerStats>({
    available: 0,
    pending: 0,
    activeOrders: 0,
    completedOrders: 0,
    services: 0,
  })
  const [orders, setOrders] = useState<SellerOrder[]>([])
  const [services, setServices] = useState<SellerService[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!user) return
    setDataLoading(true)

    const [walletResult, activeOrdersResult, completedOrdersResult, servicesResult, recentOrdersResult] =
      await Promise.all([
        supabase.from('wallets').select('available_balance, pending_balance').eq('user_id', user.id).maybeSingle(),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('seller_id', user.id).in('order_status', ['ACTIVE', 'DELIVERED', 'REVISION_REQUESTED']),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('seller_id', user.id).eq('order_status', 'COMPLETED'),
        supabase.from('services').select('id, title, price, status, is_active').eq('seller_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('orders').select('id, title, amount, order_status, created_at').eq('seller_id', user.id).order('created_at', { ascending: false }).limit(5),
      ])

    setStats({
      available: walletResult.data?.available_balance || 0,
      pending: walletResult.data?.pending_balance || 0,
      activeOrders: activeOrdersResult.count || 0,
      completedOrders: completedOrdersResult.count || 0,
      services: servicesResult.data?.length || 0,
    })
    setServices((servicesResult.data || []) as SellerService[])
    setOrders((recentOrdersResult.data || []) as SellerOrder[])
    setDataLoading(false)
  }, [supabase, user])

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, router, user])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const statCards = useMemo(
    () => [
      ['Available Earnings', formatCurrency(stats.available), 'Ready to withdraw'],
      ['Pending Escrow', formatCurrency(stats.pending), 'Awaiting delivery acceptance'],
      ['Active Orders', stats.activeOrders.toString(), 'Needs delivery or review'],
      ['Published Services', stats.services.toString(), 'Visible marketplace offers'],
    ],
    [stats]
  )

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading || !user) {
    return (
      <div className='grid min-h-screen place-items-center'>
        <Loader2 className='h-8 w-8 animate-spin text-[#b97822]' />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#f7f3ec] px-3 py-3'>
      <div className='mx-auto grid max-w-[1320px] gap-3 lg:grid-cols-[250px_1fr]'>
        <aside className='hidden min-h-[calc(100vh-96px)] rounded-lg bg-[#101828] p-5 text-white lg:flex lg:flex-col'>
          <Link href='/' className='mb-9 flex items-center gap-3'>
            <div className='grid h-10 w-10 place-items-center rounded-lg bg-[#d8952f] font-serif text-lg font-bold text-[#101828]'>K</div>
            <div>
              <p className='text-sm font-extrabold tracking-[0.14em]'>KINGDOM</p>
              <p className='text-[10px] uppercase tracking-[0.18em] text-white/55'>Marketplace</p>
            </div>
          </Link>

          <nav className='space-y-1'>
            {menu.map(({ label, icon: Icon, active, href }) => (
              <Link
                key={label}
                href={href}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold transition ${
                  active ? 'bg-white/12 text-white' : 'text-white/68 hover:bg-white/8 hover:text-white'
                }`}
              >
                <span className='flex items-center gap-3'>
                  <Icon className='h-4 w-4' />
                  {label}
                </span>
              </Link>
            ))}
          </nav>

          <button onClick={signOut} className='mt-auto flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-white/68 hover:bg-white/8 hover:text-white'>
            <LogOut className='h-4 w-4' />
            Log out
          </button>
        </aside>

        <main className='rounded-lg bg-white p-5 shadow-[0_18px_60px_rgba(33,24,10,0.08)] sm:p-8'>
          <div className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div>
              <h1 className='text-3xl font-extrabold'>Seller dashboard</h1>
              <p className='mt-1 text-sm text-[#667085]'>Operate your services, orders, messages, and earnings from live marketplace data.</p>
            </div>
            <div className='flex items-center gap-2'>
              <Button variant='outline' size='icon' className='border-[#eadfce] bg-[#fffdf8]'>
                <Bell className='h-4 w-4' />
              </Button>
              <Button variant='outline' size='icon' className='border-[#eadfce] bg-[#fffdf8]' onClick={() => loadData()}>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </div>
          </div>

          <div className='mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            {statCards.map(([label, value, detail]) => (
              <div key={label} className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
                <p className='text-xs font-medium text-[#667085]'>{label}</p>
                <p className='mt-3 text-3xl font-extrabold'>{dataLoading ? '...' : value}</p>
                <p className='mt-2 text-xs font-semibold text-[#15803d]'>{detail}</p>
              </div>
            ))}
          </div>

          <div className='grid gap-5 xl:grid-cols-[1fr_0.9fr]'>
            <section className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
              <div className='mb-5 flex items-center justify-between'>
                <div>
                  <h2 className='font-extrabold'>Recent Orders</h2>
                  <p className='mt-1 text-xs text-[#667085]'>Only real orders assigned to this seller appear here.</p>
                </div>
                <Link href='/dashboard/payments' className='text-xs font-bold text-[#8a5a18]'>View all</Link>
              </div>
              <div className='space-y-3'>
                {orders.map((order) => (
                  <div key={order.id} className='flex items-center gap-3 rounded-lg bg-white p-3'>
                    <div className='grid h-11 w-11 place-items-center rounded-lg bg-[#f2eadc] text-[#8a5a18]'>
                      <CalendarCheck className='h-5 w-5' />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-bold'>{order.title}</p>
                      <p className='text-[11px] uppercase tracking-wide text-[#98a2b3]'>{formatTimeAgo(order.created_at)}</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm font-extrabold'>{formatCurrency(order.amount)}</p>
                      <p className='text-xs font-bold text-[#b97822]'>{order.order_status}</p>
                    </div>
                  </div>
                ))}
                {!orders.length && (
                  <div className='rounded-lg border border-dashed border-[#d8c9b5] bg-white p-8 text-center text-sm text-[#667085]'>
                    No seller orders yet.
                  </div>
                )}
              </div>
            </section>

            <section className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
              <div className='mb-5 flex items-center justify-between'>
                <h2 className='font-extrabold'>Services</h2>
                <Button size='sm' variant='outline' className='border-[#eadfce] bg-white'>
                  <Plus className='mr-2 h-4 w-4' />
                  New
                </Button>
              </div>
              <div className='space-y-3'>
                {services.map((service) => (
                  <div key={service.id} className='rounded-lg bg-white p-4'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-bold'>{service.title}</p>
                        <p className='mt-1 text-xs text-[#667085]'>{formatCurrency(service.price)}</p>
                      </div>
                      <span className='rounded-full bg-[#f2eadc] px-2 py-1 text-[10px] font-bold text-[#8a5a18]'>
                        {service.status}
                      </span>
                    </div>
                  </div>
                ))}
                {!services.length && (
                  <div className='rounded-lg border border-dashed border-[#d8c9b5] bg-white p-8 text-center'>
                    <Briefcase className='mx-auto h-8 w-8 text-[#b97822]' />
                    <p className='mt-3 text-sm font-bold'>Create your first service</p>
                    <p className='mt-1 text-xs leading-5 text-[#667085]'>The next implementation step is a seller service editor backed by the services table.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
