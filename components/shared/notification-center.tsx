'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck, Loader2, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase-client'
import { formatTimeAgo } from '@/lib/utils'
import { Database } from '@/types/database'

type NotificationRow = Database['public']['Tables']['notifications']['Row']

function hrefFor(notification: NotificationRow) {
  if (notification.conversation_id) return '/dashboard/messages'
  if (notification.order_id) return `/dashboard/orders/${notification.order_id}`
  return '/dashboard/buyer'
}

export function NotificationCenter() {
  const supabase = useMemo(() => createClient(), [])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<NotificationRow[]>([])

  const unread = notifications.filter((item) => !item.is_read).length

  const loadNotifications = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    setUserId(user?.id || null)
    if (!user) return

    setLoading(true)
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(12)

    if (!error) setNotifications((data || []) as NotificationRow[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => void loadNotifications()
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [loadNotifications, supabase, userId])

  useEffect(() => {
    if (!open) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])

  const markAllRead = async () => {
    if (!notifications.some((item) => !item.is_read)) return
    await supabase.rpc('mark_notification_read', { target_notification_id: null })
    setNotifications((current) => current.map((item) => ({ ...item, is_read: true })))
  }

  if (!userId) return null

  return (
    <div className='static sm:relative'>
      <button
        type='button'
        className='relative grid h-11 w-11 place-items-center rounded-md border border-white/20 bg-white/10 text-white transition hover:border-[#f0c56a] hover:bg-white/15'
        onClick={() => {
          setOpen((current) => !current)
          if (!open) void loadNotifications()
        }}
        aria-label='Notifications'
        aria-expanded={open}
      >
        <Bell className='h-5 w-5' />
        {!!unread && (
          <span className='absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-[#06172f] bg-[#f04438] px-1 text-[10px] font-extrabold leading-none text-white'>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type='button'
            className='fixed inset-0 z-[80] cursor-default bg-black/10 sm:hidden'
            aria-label='Close notifications'
            onClick={() => setOpen(false)}
          />
          <div className='fixed inset-x-2 top-[68px] z-[90] max-h-[calc(100dvh-84px)] overflow-hidden rounded-lg border border-[#d8c9b5] bg-white text-[#101828] shadow-[0_20px_60px_rgba(16,24,40,0.24)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[400px] sm:max-h-none'>
            <div className='flex items-center justify-between border-b border-[#eadfce] bg-[#fffdf8] px-4 py-3'>
              <div>
                <p className='text-sm font-extrabold'>Notifications</p>
                <p className='text-[11px] text-[#667085]'>{unread} unread</p>
              </div>
              <div className='flex items-center gap-1'>
                <Button variant='ghost' size='sm' onClick={() => void loadNotifications()} className='h-8 text-xs text-[#344054] hover:bg-white'>
                  <RefreshCw className='mr-1 h-3.5 w-3.5' />
                  Refresh
                </Button>
                <Button variant='ghost' size='sm' onClick={markAllRead} disabled={!unread} className='h-8 text-xs text-[#344054] hover:bg-white disabled:opacity-40'>
                  <CheckCheck className='mr-1 h-3.5 w-3.5' />
                  Read
                </Button>
                <button
                  type='button'
                  className='grid h-8 w-8 place-items-center rounded-md text-[#667085] hover:bg-[#fff3dc] sm:hidden'
                  aria-label='Close notifications'
                  onClick={() => setOpen(false)}
                >
                  <X className='h-4 w-4' />
                </button>
              </div>
            </div>
            <div className='max-h-[calc(100dvh-154px)] overflow-y-auto p-2 sm:max-h-[420px]'>
              {loading ? (
                <div className='grid min-h-28 place-items-center'>
                  <Loader2 className='h-5 w-5 animate-spin text-[#b97822]' />
                </div>
              ) : notifications.length ? (
                notifications.map((item) => (
                  <Link
                    key={item.id}
                    href={hrefFor(item)}
                    onClick={() => {
                      setOpen(false)
                      if (!item.is_read) {
                        setNotifications((current) => current.map((notification) => notification.id === item.id ? { ...notification, is_read: true } : notification))
                        void supabase.rpc('mark_notification_read', { target_notification_id: item.id })
                      }
                    }}
                    className={`block rounded-md border px-3 py-3 transition hover:bg-[#fffdf8] ${item.is_read ? 'border-transparent bg-white' : 'border-[#f5d89a] bg-[#fff4d6]'}`}
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <p className='min-w-0 break-words text-sm font-extrabold leading-5 text-[#101828]'>{item.title}</p>
                      {!item.is_read && <span className='mt-1 h-2 w-2 rounded-full bg-[#b42318]' />}
                    </div>
                    <p className='mt-1 line-clamp-3 break-words text-xs leading-5 text-[#344054]'>{item.body}</p>
                    <p className='mt-2 text-[11px] font-bold text-[#667085]'>{formatTimeAgo(item.created_at)}</p>
                  </Link>
                ))
              ) : (
                <div className='px-4 py-10 text-center text-sm text-[#667085]'>No notifications yet.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
