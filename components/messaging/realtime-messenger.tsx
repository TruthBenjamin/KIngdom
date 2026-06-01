'use client'

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Check,
  CheckCheck,
  ChevronLeft,
  FileArchive,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  PackageCheck,
  Paperclip,
  Search,
  Send,
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase-client'
import {
  ConversationParticipant,
  MarketplaceConversation,
  MarketplaceMessage,
  MESSAGE_PAGE_SIZE,
  formatChatTimestamp,
  formatLastSeen,
  getInboxSummaries,
  getOtherParticipant,
  markInboxConversationRead,
  sendMarketplaceMessage,
} from '@/lib/messaging'
import { cn } from '@/lib/utils'

type PresenceState = {
  user_id: string
  is_online: boolean
  last_seen: string
}

type TypingState = {
  conversation_id: string
  user_id: string
  is_typing: boolean
  updated_at: string
}

const emptyPreview = 'No messages yet'

function initials(name?: string | null) {
  return (name || 'KM')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function messagePreview(message?: MarketplaceMessage | null) {
  if (!message) return emptyPreview
  if (message.message_type === 'IMAGE') return 'Image attachment'
  if (message.message_type === 'FILE') return message.attachment_name || 'File attachment'
  if (message.message_type === 'DELIVERABLE') return message.message || 'Order delivery'
  return message.message || emptyPreview
}

function attachmentType(file: File) {
  if (file.type.startsWith('image/')) return 'IMAGE'
  if (file.type.includes('zip')) return 'FILE'
  if (file.type.includes('pdf')) return 'FILE'
  return 'FILE'
}

function attachmentIcon(type?: string | null) {
  if (type?.includes('zip')) return FileArchive
  if (type?.includes('pdf')) return FileText
  return ImageIcon
}

function StatusTicks({ status }: { status: MarketplaceMessage['status'] }) {
  if (status === 'READ') return <CheckCheck className='h-3.5 w-3.5 text-[#0d9488]' />
  if (status === 'DELIVERED') return <CheckCheck className='h-3.5 w-3.5 text-[#667085]' />
  return <Check className='h-3.5 w-3.5 text-[#98a2b3]' />
}

export default function RealtimeMessenger() {
  const supabase = useMemo(() => createClient(), [])
  const searchParams = useSearchParams()
  const requestedConversationId = searchParams?.get('conversation') || null
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<MarketplaceConversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MarketplaceMessage[]>([])
  const [messageDraft, setMessageDraft] = useState('')
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [presence, setPresence] = useState<Record<string, PresenceState>>({})
  const [typing, setTyping] = useState<Record<string, TypingState>>({})
  const [mobileInboxOpen, setMobileInboxOpen] = useState(true)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeConversation = conversations.find((conversation) => conversation.id === activeId) || null
  const otherParticipant = userId && activeConversation ? getOtherParticipant(activeConversation, userId) : null
  const activeTyping = activeId
    ? Object.values(typing).some(
        (item) =>
          item.conversation_id === activeId &&
          item.user_id !== userId &&
          item.is_typing &&
          Date.now() - new Date(item.updated_at).getTime() < 6000
      )
    : false

  const filteredConversations = conversations.filter((conversation) => {
    if (!userId) return false
    const participant = getOtherParticipant(conversation, userId)
    const query = search.trim().toLowerCase()
    if (!query) return true

    return (
      participant?.full_name?.toLowerCase().includes(query) ||
      conversation.order?.title?.toLowerCase().includes(query) ||
      messagePreview(conversation.last_message).toLowerCase().includes(query)
    )
  })

  const loadConversations = useCallback(
    async () => {
      try {
        const enriched = await getInboxSummaries(supabase, { limit: 60 })
        setConversations(enriched)
        setActiveId((current) => {
          if (current && enriched.some((conversation) => conversation.id === current)) return current
          if (requestedConversationId && enriched.some((conversation) => conversation.id === requestedConversationId)) {
            return requestedConversationId
          }
          return enriched[0]?.id || null
        })
      } catch (error) {
        console.error(error)
        setConversations([])
      }
    },
    [requestedConversationId, supabase]
  )

  const loadMessages = useCallback(
    async (conversationId: string, before?: string) => {
      let query = supabase
        .from('messages')
        .select('*, sender:users!messages_sender_id_fkey(id, full_name, avatar_url, role)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(MESSAGE_PAGE_SIZE)

      if (before) query = query.lt('created_at', before)

      const { data, error } = await query
      if (error) {
        console.error(error)
        return
      }

      const nextMessages = ((data || []) as unknown as MarketplaceMessage[]).reverse()
      setHasMore(nextMessages.length === MESSAGE_PAGE_SIZE)
      setMessages((current) => (before ? [...nextMessages, ...current] : nextMessages))
    },
    [supabase]
  )

  const markConversationRead = useCallback(
    async (conversationId: string) => {
      try {
        const marked = await markInboxConversationRead(supabase, conversationId)
        if (!marked) return

        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === conversationId ? { ...conversation, unread_count: 0 } : conversation
          )
        )
      } catch (error) {
        console.error(error)
      }
    },
    [supabase]
  )

  const updateTyping = useCallback(
    async (isTyping: boolean) => {
      if (!activeId || !userId) return

      await supabase.from('typing_status').upsert(
        {
          conversation_id: activeId,
          user_id: userId,
          is_typing: isTyping,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'conversation_id,user_id' }
      )
    },
    [activeId, supabase, userId]
  )

  const handleDraftChange = (value: string) => {
    setMessageDraft(value)
    void updateTyping(value.trim().length > 0)

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      void updateTyping(false)
    }, 2500)
  }

  const sendMessage = async (
    messageType: MarketplaceMessage['message_type'],
    payload?: {
      text?: string
      attachmentUrl?: string | null
      attachmentType?: string | null
      attachmentName?: string | null
      attachmentSize?: number | null
    }
  ) => {
    if (!activeConversation || !userId) return

    const text = (payload?.text ?? messageDraft).trim()
    if (!text && !payload?.attachmentUrl) return

    const receiverId = activeConversation.buyer_id === userId ? activeConversation.seller_id : activeConversation.buyer_id
    const optimistic: MarketplaceMessage = {
      id: `temp-${crypto.randomUUID()}`,
      conversation_id: activeConversation.id,
      sender_id: userId,
      receiver_id: receiverId,
      message: text,
      message_type: messageType,
      attachment_url: payload?.attachmentUrl || null,
      attachment_type: payload?.attachmentType || null,
      attachment_name: payload?.attachmentName || null,
      attachment_size: payload?.attachmentSize || null,
      status: 'SENT',
      metadata: null,
      created_at: new Date().toISOString(),
    }

    setSending(true)
    setMessages((current) => [...current, optimistic])
    setMessageDraft('')
    await updateTyping(false)

    try {
      const messageId = await sendMarketplaceMessage(supabase, {
        conversationId: activeConversation.id,
        body: text,
        messageType,
        attachmentUrl: payload?.attachmentUrl || null,
        attachmentType: payload?.attachmentType || null,
        attachmentName: payload?.attachmentName || null,
        attachmentSize: payload?.attachmentSize || null,
      })

      setMessages((current) =>
        current.map((message) => (message.id === optimistic.id ? { ...optimistic, id: messageId } : message))
      )
      await loadConversations()
    } catch (error) {
      console.error(error)
      setMessages((current) => current.filter((message) => message.id !== optimistic.id))
      setMessageDraft(text)
    } finally {
      setSending(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void sendMessage('TEXT')
  }

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !activeConversation || !userId) return

    setUploading(true)
    const extension = file.name.split('.').pop() || 'file'
    const path = `${userId}/${activeConversation.id}/${crypto.randomUUID()}.${extension}`
    const { error } = await supabase.storage.from('message-attachments').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (error) {
      console.error(error)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('message-attachments').getPublicUrl(path)
    await sendMessage(attachmentType(file) as MarketplaceMessage['message_type'], {
      text: file.type.startsWith('image/') ? '' : file.name,
      attachmentUrl: data.publicUrl,
      attachmentType: file.type || 'application/octet-stream',
      attachmentName: file.name,
      attachmentSize: file.size,
    })

    setUploading(false)
    event.target.value = ''
  }

  useEffect(() => {
    const boot = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      setUserId(user.id)
      await supabase.from('user_presence').upsert(
        {
          user_id: user.id,
          is_online: true,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      await loadConversations()
      setLoading(false)
    }

    void boot()
  }, [loadConversations, supabase])

  useEffect(() => {
    if (!activeId || !userId) return

    setMessages([])
    void loadMessages(activeId)
    void markConversationRead(activeId)
  }, [activeId, loadMessages, markConversationRead, userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeTyping])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`messaging:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` }, async (payload) => {
        const next = payload.new as MarketplaceMessage
        const old = payload.old as MarketplaceMessage

        if (payload.eventType === 'INSERT' && next) {
          if (next.receiver_id === userId && next.status === 'SENT' && next.conversation_id === activeId) {
            await markInboxConversationRead(supabase, next.conversation_id)
          }

          setMessages((current) => {
            if (next.conversation_id !== activeId || current.some((message) => message.id === next.id)) return current
            return [...current.filter((message) => !message.id.startsWith('temp-')), next]
          })

          await loadConversations()
        }

        if (payload.eventType === 'UPDATE' && next) {
          setMessages((current) =>
            current.map((message) => (message.id === next.id ? { ...message, ...next } : message))
          )
          await loadConversations()
        }

        if (payload.eventType === 'DELETE' && old) {
          setMessages((current) => current.filter((message) => message.id !== old.id))
          await loadConversations()
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `sender_id=eq.${userId}` }, async (payload) => {
        const next = payload.new as MarketplaceMessage
        const old = payload.old as MarketplaceMessage

        if (payload.eventType === 'INSERT' && next) {
          setMessages((current) => {
            if (next.conversation_id !== activeId || current.some((message) => message.id === next.id)) return current
            return [...current.filter((message) => !message.id.startsWith('temp-')), next]
          })

          await loadConversations()
        }

        if (payload.eventType === 'UPDATE' && next) {
          setMessages((current) =>
            current.map((message) => (message.id === next.id ? { ...message, ...next } : message))
          )
          await loadConversations()
        }

        if (payload.eventType === 'DELETE' && old) {
          setMessages((current) => current.filter((message) => message.id !== old.id))
          await loadConversations()
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `buyer_id=eq.${userId}` }, () => {
        void loadConversations()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `seller_id=eq.${userId}` }, () => {
        void loadConversations()
      })
      .subscribe()

    const markOffline = () => {
      void supabase.from('user_presence').upsert(
        {
          user_id: userId,
          is_online: false,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    }

    window.addEventListener('beforeunload', markOffline)

    return () => {
      window.removeEventListener('beforeunload', markOffline)
      void updateTyping(false)
      void supabase.removeChannel(channel)
      markOffline()
    }
  }, [activeId, loadConversations, supabase, updateTyping, userId])

  useEffect(() => {
    if (!activeId || !userId || !otherParticipant?.id) return

    const channel = supabase
      .channel(`conversation-state:${activeId}:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'typing_status', filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          const next = payload.new as TypingState
          if (!next) return
          setTyping((current) => ({ ...current, [`${next.conversation_id}:${next.user_id}`]: next }))
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_presence', filter: `user_id=eq.${otherParticipant.id}` },
        (payload) => {
          const next = payload.new as PresenceState
          if (!next) return
          setPresence((current) => ({ ...current, [next.user_id]: next }))
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [activeId, otherParticipant?.id, supabase, userId])

  if (loading) {
    return (
      <div className='grid min-h-[70vh] place-items-center'>
        <Loader2 className='h-8 w-8 animate-spin text-[#b97822]' />
      </div>
    )
  }

  if (!userId) {
    return (
      <div className='grid min-h-[70vh] place-items-center px-4 text-center'>
        <div>
          <MessageCircle className='mx-auto h-10 w-10 text-[#b97822]' />
          <h1 className='mt-4 text-2xl font-extrabold'>Sign in to view messages</h1>
          <p className='mt-2 text-sm text-[#667085]'>Your marketplace conversations are protected.</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-white px-0 py-0 sm:px-5 sm:py-5'>
      <div className='mx-auto grid h-[calc(100dvh-65px)] w-full max-w-[1500px] min-w-0 overflow-hidden border border-[#e6d9c8] bg-white shadow-[0_18px_70px_rgba(33,24,10,0.1)] sm:h-[calc(100dvh-104px)] sm:rounded-lg lg:grid-cols-[380px_minmax(0,1fr)]'>
        <aside
          className={cn(
            'min-h-0 border-r border-[#eadfce] bg-[#fffdf8]',
            !mobileInboxOpen && 'hidden lg:block'
          )}
        >
          <div className='border-b border-[#eadfce] p-5'>
            <div>
              <h1 className='text-2xl font-extrabold'>Messages</h1>
              <p className='mt-1 text-sm text-[#667085]'>Buyers, sellers, orders, and deliveries.</p>
            </div>
            <div className='mt-5 flex items-center gap-2 rounded-lg border border-[#eadfce] bg-white px-3'>
              <Search className='h-4 w-4 text-[#98a2b3]' />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder='Search messages'
                className='border-0 px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0'
              />
            </div>
          </div>

          <div className='h-[calc(100%-154px)] overflow-y-auto p-3'>
            {filteredConversations.map((conversation) => {
              const participant = getOtherParticipant(conversation, userId) as ConversationParticipant | null
              const participantPresence = participant ? presence[participant.id] : null
              const isActive = conversation.id === activeId

              return (
                <button
                  key={conversation.id}
                  onClick={() => {
                    setActiveId(conversation.id)
                    setMobileInboxOpen(false)
                  }}
                  className={cn(
                    'flex w-full gap-3 rounded-lg p-3 text-left transition',
                    isActive ? 'bg-[#efe5d4]' : 'hover:bg-white'
                  )}
                >
                  <div className='relative h-11 w-11 shrink-0'>
                    <Avatar
                      src={participant?.avatar_url || undefined}
                      fallback={initials(participant?.full_name)}
                      className='h-11 w-11'
                    />
                    <span
                      className={cn(
                        'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white',
                        participantPresence?.is_online ? 'bg-[#16a34a]' : 'bg-[#98a2b3]'
                      )}
                    />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-start justify-between gap-3'>
                      <p className='truncate text-sm font-extrabold'>{participant?.full_name || 'Marketplace user'}</p>
                      <span className='shrink-0 text-[11px] text-[#98a2b3]'>
                        {formatChatTimestamp(conversation.last_message_at || conversation.last_message?.created_at)}
                      </span>
                    </div>
                    <p className='mt-1 truncate text-xs text-[#667085]'>{messagePreview(conversation.last_message)}</p>
                    <div className='mt-2 flex items-center justify-between gap-2'>
                      <span className='truncate text-[11px] font-bold uppercase tracking-wide text-[#8a5a18]'>
                        {conversation.order?.order_status || conversation.order?.status || conversation.status}
                      </span>
                      {!!conversation.unread_count && (
                        <span className='grid h-5 min-w-5 place-items-center rounded-full bg-[#101828] px-1.5 text-[11px] font-bold text-white'>
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}

            {!filteredConversations.length && (
              <div className='px-4 py-16 text-center'>
                <MessageCircle className='mx-auto h-9 w-9 text-[#c58b35]' />
                <p className='mt-3 text-sm font-bold'>No conversations yet</p>
                <p className='mt-1 text-xs leading-5 text-[#667085]'>Contact a seller or place an order to open a thread.</p>
              </div>
            )}
          </div>
        </aside>

        <main className={cn('min-w-0 flex min-h-0 flex-col', mobileInboxOpen && 'hidden lg:flex')}>
          {activeConversation && otherParticipant ? (
            <>
              <header className='flex items-center justify-between gap-3 border-b border-[#eadfce] bg-white p-3 sm:p-5'>
                <div className='flex min-w-0 items-center gap-3'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='lg:hidden'
                    onClick={() => setMobileInboxOpen(true)}
                    aria-label='Back to inbox'
                  >
                    <ChevronLeft className='h-5 w-5' />
                  </Button>
                  <Avatar
                    src={otherParticipant.avatar_url || undefined}
                    fallback={initials(otherParticipant.full_name)}
                    className='h-10 w-10 sm:h-11 sm:w-11'
                  />
                  <div className='min-w-0'>
                    <p className='truncate font-extrabold'>{otherParticipant.full_name || 'Marketplace user'}</p>
                    <p className='text-xs text-[#667085]'>
                      {activeTyping
                        ? `${otherParticipant.role === 'seller' ? 'Seller' : 'Buyer'} is typing...`
                        : formatLastSeen(presence[otherParticipant.id]?.last_seen)}
                    </p>
                  </div>
                </div>
                {activeConversation.order && (
                  <div className='hidden items-center gap-2 rounded-lg border border-[#eadfce] bg-[#fffdf8] px-3 py-2 text-xs font-bold sm:flex'>
                    <PackageCheck className='h-4 w-4 text-[#b97822]' />
                    <span className='max-w-[180px] truncate'>{activeConversation.order.title}</span>
                  </div>
                )}
              </header>

              <div className='min-h-0 flex-1 overflow-y-auto bg-white p-3 sm:p-6'>
                {hasMore && messages[0] && (
                  <div className='mb-5 text-center'>
                    <Button variant='outline' size='sm' onClick={() => loadMessages(activeConversation.id, messages[0].created_at)}>
                      Load older
                    </Button>
                  </div>
                )}

                <div className='space-y-4'>
                  {messages.map((message) => {
                    const mine = message.sender_id === userId
                    const Attachment = attachmentIcon(message.attachment_type)

                    return (
                      <div key={message.id} className={cn('flex gap-2', mine && 'justify-end')}>
                        {!mine && (
                          <Avatar
                            src={otherParticipant.avatar_url || undefined}
                            fallback={initials(otherParticipant.full_name)}
                            className='mt-1 h-8 w-8'
                          />
                        )}
                        <div className={cn('min-w-0 max-w-[84%] sm:max-w-[68%]', mine && 'items-end')}>
                          <div
                            className={cn(
                              'rounded-lg px-4 py-3 text-sm leading-6 shadow-sm',
                              mine
                                ? 'bg-[#101828] text-white'
                                : message.message_type === 'SYSTEM'
                                  ? 'border border-[#eadfce] bg-white text-[#5b6472]'
                                  : 'bg-white text-[#101828]'
                            )}
                          >
                            {message.attachment_url && message.message_type === 'IMAGE' && (
                              <a href={message.attachment_url} target='_blank' rel='noreferrer'>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={message.attachment_url}
                                  alt={message.attachment_name || 'Message attachment'}
                                  className='mb-2 max-h-72 rounded-lg object-cover'
                                />
                              </a>
                            )}

                            {message.attachment_url && message.message_type !== 'IMAGE' && (
                              <a
                                href={message.attachment_url}
                                target='_blank'
                                rel='noreferrer'
                                className={cn(
                                  'mb-2 flex items-center gap-3 rounded-lg border px-3 py-2',
                                  mine ? 'border-white/20 bg-white/10' : 'border-[#eadfce] bg-[#fffdf8]'
                                )}
                              >
                                <Attachment className='h-5 w-5 shrink-0' />
                                <span className='min-w-0 flex-1 truncate font-bold'>
                                  {message.attachment_name || 'Attachment'}
                                </span>
                              </a>
                            )}

                            {message.message && <p className='whitespace-pre-wrap break-words'>{message.message}</p>}
                          </div>
                          <div
                            className={cn(
                              'mt-1 flex items-center gap-1 text-[11px] text-[#98a2b3]',
                              mine && 'justify-end'
                            )}
                          >
                            <span>{formatChatTimestamp(message.created_at)}</span>
                            {mine && <StatusTicks status={message.status} />}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {activeTyping && (
                    <div className='flex items-center gap-2 text-sm font-medium text-[#667085]'>
                      <span className='h-2 w-2 animate-pulse rounded-full bg-[#b97822]' />
                      {otherParticipant.role === 'seller' ? 'Seller' : 'Buyer'} is typing...
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              </div>

              <form onSubmit={handleSubmit} className='border-t border-[#eadfce] bg-white p-3 sm:p-4'>
                <input
                  ref={fileInputRef}
                  type='file'
                  className='hidden'
                  accept='image/png,image/jpeg,image/webp,application/pdf,application/zip,application/x-zip-compressed'
                  onChange={handleFileUpload}
                />
                <div className='flex items-end gap-2 rounded-lg border border-[#eadfce] bg-[#fffdf8] p-2'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    aria-label='Attach file'
                  >
                    {uploading ? <Loader2 className='h-5 w-5 animate-spin' /> : <Paperclip className='h-5 w-5' />}
                  </Button>
                  <Textarea
                    value={messageDraft}
                    onChange={(event) => handleDraftChange(event.target.value)}
                    placeholder='Type a message'
                    rows={1}
                    className='max-h-32 min-h-11 resize-none border-0 bg-transparent px-2 py-3 focus-visible:ring-0 focus-visible:ring-offset-0'
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        void sendMessage('TEXT')
                      }
                    }}
                  />
                  <Button
                    type='submit'
                    size='icon'
                    className='bg-[#101828] text-white hover:bg-[#1f2937]'
                    disabled={sending || (!messageDraft.trim() && !uploading)}
                    aria-label='Send message'
                  >
                    {sending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Send className='h-4 w-4' />}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className='grid flex-1 place-items-center bg-white p-6 text-center'>
              <div>
                <MessageCircle className='mx-auto h-12 w-12 text-[#c58b35]' />
                <h2 className='mt-4 text-2xl font-extrabold'>Select a conversation</h2>
                <p className='mt-2 max-w-sm text-sm leading-6 text-[#667085]'>
                  Inbox updates, unread counts, delivery ticks, files, and typing indicators will appear here in real time.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
