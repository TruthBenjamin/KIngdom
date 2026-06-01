'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flag, Heart, Loader2, MessageCircle, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase-client'
import { getOrCreateConversation } from '@/lib/messaging'
import { setSavedServiceAction } from '@/domains/buyers/actions'

type ServiceActionsProps = {
  serviceId: string
  sellerId: string
  price: number
}

async function getAccessToken(supabase: ReturnType<typeof createClient>) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) throw new Error('Sign in again to continue')
  return session.access_token
}

function actionError(result: unknown) {
  return result && typeof result === 'object' && 'error' in result ? String((result as { error?: string }).error || '') : ''
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
    const viewed = JSON.parse(window.localStorage.getItem('recentlyViewedServices') || '[]') as string[]
    window.localStorage.setItem('recentlyViewedServices', JSON.stringify([serviceId, ...viewed.filter((id) => id !== serviceId)].slice(0, 8)))

    return () => {
      mounted = false
    }
  }, [serviceId, supabase])

  const requireUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const {
      data: { user },
    } = session ? await supabase.auth.getUser() : { data: { user: null } }

    if (!user) {
      const next = `${window.location.pathname}${window.location.search}`
      router.push(`/login?next=${encodeURIComponent(next)}`)
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
      await requireUser()
      const nextSaved = !saved
      const token = await getAccessToken(supabase)
      const result = await setSavedServiceAction(token, serviceId, nextSaved)
      const errorMessage = actionError(result)
      if (errorMessage) throw new Error(errorMessage)
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
      const user = await requireUser()
      if (user.id === sellerId) throw new Error('You cannot book your own service')
      router.push(`/checkout/${serviceId}`)
    } catch (error: any) {
      if (error.message !== 'Sign in to continue') toast.error(error.message || 'Could not create order')
    } finally {
      setBusy(null)
    }
  }

  const reportService = async () => {
    const reason = window.prompt('What should the moderation team review about this service?')
    if (!reason?.trim()) return

    setBusy('report')
    try {
      await requireUser()
      const { error } = await supabase.rpc('submit_abuse_report', {
        target_kind: 'service',
        target_uuid: serviceId,
        report_reason: reason.trim(),
        report_details: null,
      })

      if (error) throw error
      toast.success('Report sent to moderation')
    } catch (error: any) {
      if (error.message !== 'Sign in to continue') toast.error(error.message || 'Could not send report')
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
      <Button
        variant='ghost'
        className='h-10 w-full text-[#667085] hover:bg-[#fff3dc]'
        onClick={reportService}
        disabled={busy === 'report'}
      >
        {busy === 'report' ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Flag className='mr-2 h-4 w-4' />}
        Report this service
      </Button>
    </div>
  )
}
