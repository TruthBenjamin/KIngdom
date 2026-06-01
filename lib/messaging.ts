import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export type MessageType = Database['public']['Enums']['message_type']
export type MessageStatus = Database['public']['Enums']['message_status']

export type ConversationParticipant = {
  id: string
  full_name: string | null
  username?: string | null
  avatar_url: string | null
  role: 'buyer' | 'seller' | 'admin'
}

export type MarketplaceOrder = {
  id: string
  title: string
  status?: string
  order_status?: string
  payment_status?: string
}

export type MarketplaceConversation = Database['public']['Tables']['conversations']['Row'] & {
  buyer?: ConversationParticipant | null
  seller?: ConversationParticipant | null
  order?: MarketplaceOrder | null
  last_message?: MarketplaceMessage | null
  unread_count?: number
}

export type MarketplaceMessage = Database['public']['Tables']['messages']['Row'] & {
  sender?: ConversationParticipant | null
}

type InboxSummaryRow = Database['public']['Functions']['get_inbox_summaries']['Returns'][number]

export type Notification = Database['public']['Tables']['notifications']['Row']

export const MESSAGE_PAGE_SIZE = 30

export function getOtherParticipant(conversation: MarketplaceConversation, userId: string) {
  return conversation.buyer_id === userId ? conversation.seller : conversation.buyer
}

export function formatChatTimestamp(value?: string | null) {
  if (!value) return ''

  const date = new Date(value)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()

  return new Intl.DateTimeFormat('en-US', {
    hour: sameDay ? 'numeric' : undefined,
    minute: sameDay ? '2-digit' : undefined,
    month: sameDay ? undefined : 'short',
    day: sameDay ? undefined : 'numeric',
  }).format(date)
}

export function formatLastSeen(value?: string | null) {
  if (!value) return 'Offline'

  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(0, Math.floor(diff / 60000))

  if (minutes < 2) return 'Active now'
  if (minutes < 60) return `Last seen ${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Last seen ${hours}h ago`

  const days = Math.floor(hours / 24)
  return `Last seen ${days}d ago`
}

export async function getOrCreateConversation(
  supabase: SupabaseClient<Database>,
  input: {
    buyerId: string
    sellerId: string
    orderId?: string | null
    serviceId?: string | null
  }
) {
  const { data, error } = await supabase.rpc('get_or_create_conversation', {
    target_buyer_id: input.buyerId,
    target_seller_id: input.sellerId,
    target_order_id: input.orderId ?? null,
    target_service_id: input.serviceId ?? null,
  })

  if (error) throw error

  return data
}

function objectOrNull<T>(value: unknown): T | null {
  if (!value || typeof value !== 'object') return null
  return value as T
}

export async function getInboxSummaries(
  supabase: SupabaseClient<Database>,
  options: { limit?: number; offset?: number } = {}
): Promise<MarketplaceConversation[]> {
  const { data, error } = await supabase.rpc('get_inbox_summaries', {
    result_limit: options.limit ?? 40,
    result_offset: options.offset ?? 0,
  })

  if (error) throw error

  return ((data || []) as InboxSummaryRow[]).map((row) => ({
    id: row.id,
    buyer_id: row.buyer_id,
    seller_id: row.seller_id,
    order_id: row.order_id,
    service_id: row.service_id,
    last_message_id: objectOrNull<MarketplaceMessage>(row.last_message)?.id || null,
    last_message_at: row.last_message_at,
    status: row.status as MarketplaceConversation['status'],
    created_at: row.created_at,
    updated_at: row.updated_at,
    buyer: objectOrNull<ConversationParticipant>(row.buyer),
    seller: objectOrNull<ConversationParticipant>(row.seller),
    order: objectOrNull<MarketplaceOrder>(row.order_summary),
    last_message: objectOrNull<MarketplaceMessage>(row.last_message),
    unread_count: row.unread_count || 0,
  }))
}

export async function markInboxConversationRead(
  supabase: SupabaseClient<Database>,
  conversationId: string
) {
  const { data, error } = await supabase.rpc('mark_conversation_read', {
    target_conversation_id: conversationId,
  })

  if (error) throw error
  return data || 0
}

export async function sendMarketplaceMessage(
  supabase: SupabaseClient<Database>,
  input: {
    conversationId: string
    body?: string
    messageType?: MessageType
    attachmentUrl?: string | null
    attachmentType?: string | null
    attachmentName?: string | null
    attachmentSize?: number | null
  }
) {
  const { data, error } = await supabase.rpc('send_conversation_message', {
    target_conversation_id: input.conversationId,
    body: input.body || '',
    target_message_type: input.messageType || 'TEXT',
    target_attachment_url: input.attachmentUrl ?? null,
    target_attachment_type: input.attachmentType ?? null,
    target_attachment_name: input.attachmentName ?? null,
    target_attachment_size: input.attachmentSize ?? null,
  })

  if (error) throw error
  return data
}
