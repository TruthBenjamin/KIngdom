'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { OrderDetailClient } from '@/components/orders/order-detail-client'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Database } from '@/types/database'

type OrderRow = Database['public']['Tables']['orders']['Row'] & {
  buyer?: { full_name: string | null } | null
  seller?: { full_name: string | null } | null
  service?: { title: string; slug: string | null } | null
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, loading, supabase } = useCurrentUser()
  const [order, setOrder] = useState<OrderRow | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [review, setReview] = useState<any | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  const loadOrder = useCallback(async () => {
    if (!user) return

    setDataLoading(true)
    const [orderResult, eventsResult, deliverablesResult, reviewResult] = await Promise.all([
      supabase
        .from('orders')
        .select('*, buyer:users!orders_buyer_id_fkey(full_name), seller:users!orders_seller_id_fkey(full_name), service:services(title, slug)')
        .eq('id', params.id)
        .maybeSingle(),
      supabase
        .from('order_events')
        .select('*, actor:users!order_events_actor_id_fkey(full_name)')
        .eq('order_id', params.id)
        .order('created_at', { ascending: false }),
      supabase.from('deliverables').select('*').eq('order_id', params.id).order('delivered_at', { ascending: false }),
      supabase.from('reviews').select('*').eq('order_id', params.id).maybeSingle(),
    ])

    const nextOrder = orderResult.data as unknown as OrderRow | null
    if (!nextOrder || (nextOrder.buyer_id !== user.id && nextOrder.seller_id !== user.id)) {
      router.push('/dashboard/payments')
      return
    }

    setOrder(nextOrder)
    setEvents(eventsResult.data || [])
    setDeliverables(deliverablesResult.data || [])
    setReview(reviewResult.data || null)
    setDataLoading(false)
  }, [params.id, router, supabase, user])

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, router, user])

  useEffect(() => {
    void loadOrder()
  }, [loadOrder])

  if (loading || dataLoading || !user || !order) {
    return (
      <div className='grid min-h-screen place-items-center'>
        <Loader2 className='h-8 w-8 animate-spin text-[#b97822]' />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#f7f3ec] px-3 py-4 sm:px-6 sm:py-8'>
      <div className='mx-auto max-w-7xl'>
        <Link href='/dashboard/payments' className='mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#8a5a18]'>
          <ArrowLeft className='h-4 w-4' />
          Orders
        </Link>
        <OrderDetailClient
          order={order}
          events={events}
          deliverables={deliverables}
          review={review}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}
