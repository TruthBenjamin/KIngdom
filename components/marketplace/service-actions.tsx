'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Loader2, MessageCircle, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { createMarketplaceOrderAction } from '@/app/actions/escrow'
import { createClient } from '@/lib/supabase-client'
import { getOrCreateConversation } from '@/lib/messaging'

type ServiceActionsProps = {
  serviceId: string
  sellerId: string
  price: number
}

async function getAccessToken(supabase: ReturnType<typeof createClient>) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) throw new Error('Sign in to continue')
  return session.access_token
}

export function ServiceActions({ serviceId, sellerId, price }: ServiceActionsProps) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadSavedState = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('saved_services')
        .select('id')
        .eq('user_id', user.id)
        .eq('service_id', serviceId)
        .maybeSingle()

      if (mounted) setSaved(Boolean(data))
    }

    void loadSavedState()

    return () => {
      mounted = false
    }
  }, [serviceId, supabase])

  const requireUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      throw new Error('Sign in to continue')
    }

    return user
  }

  const messageSeller = async () => {
    setBusy('message')
    try {
      const user = await requireUser()
      if (user.id === sellerId) throw new Error('This is your own service')

      const conversationId = await getOrCreateConversation(supabase, {
        buyerId: user.id,
        sellerId,
        serviceId,
      })

      toast.success('Conversation opened')
      router.push(`/dashboard/messages?conversation=${conversationId}`)
    } catch (error: any) {
      if (error.message !== 'Sign in to continue') toast.error(error.message || 'Could not open conversation')
    } finally {
      setBusy(null)
    }
  }

  const saveService = async () => {
    setBusy('save')
    setSaved((current) => !current)
    try {
      const user = await requireUser()
      const nextSaved = !saved
      const { error } = nextSaved
        ? await supabase.from('saved_services').upsert(
            {
              user_id: user.id,
              service_id: serviceId,
            },
            { onConflict: 'user_id,service_id' }
          )
        : await supabase.from('saved_services').delete().eq('user_id', user.id).eq('service_id', serviceId)

      if (error) throw error
      toast.success(nextSaved ? 'Service saved' : 'Service removed')
    } catch (error: any) {
      setSaved((current) => !current)
      if (error.message !== 'Sign in to continue') toast.error(error.message || 'Could not save service')
    } finally {
      setBusy(null)
    }
  }

  const bookService = async () => {
    setBusy('book')
    try {
      await requireUser()
      const token = await getAccessToken(supabase)
      await createMarketplaceOrderAction(token, serviceId)
      toast.success('Order created. Confirm payment to start the work.')
      router.push('/dashboard/payments')
    } catch (error: any) {
      if (error.message !== 'Sign in to continue') toast.error(error.message || 'Could not create order')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className='grid gap-3'>
      <Button
        className='h-11 w-full bg-[#101828] text-white hover:bg-[#1f2937]'
        onClick={bookService}
        disabled={busy === 'book'}
      >
        {busy === 'book' ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <ShoppingBag className='mr-2 h-4 w-4' />}
        Book for ${price}
      </Button>
      <Button
        variant='outline'
        className='h-11 w-full border-[#d8aa5e] bg-white text-[#8a5a18] hover:bg-[#fff3dc]'
        onClick={messageSeller}
        disabled={busy === 'message'}
      >
        {busy === 'message' ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <MessageCircle className='mr-2 h-4 w-4' />}
        Message creator
      </Button>
      <Button
        variant='outline'
        className='h-11 w-full border-[#eadfce] bg-white'
        onClick={saveService}
        disabled={busy === 'save'}
      >
        {busy === 'save' ? (
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
        ) : (
          <Heart className={`mr-2 h-4 w-4 ${saved ? 'fill-[#d8952f] text-[#d8952f]' : ''}`} />
        )}
        {saved ? 'Saved' : 'Save service'}
      </Button>
    </div>
  )
}
