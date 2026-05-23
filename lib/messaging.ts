import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export type MessageType = Database['public']['Enums']['message_type']
export type MessageStatus = Database['public']['Enums']['message_status']

export type ConversationParticipant = {
  id: string
  full_name: string | null
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
    listingId?: string | null
  }
) {
  const { data, error } = await supabase.rpc('get_or_create_conversation', {
    target_buyer_id: input.buyerId,
    target_seller_id: input.sellerId,
    target_order_id: input.orderId ?? null,
    target_listing_id: input.listingId ?? null,
  })

  if (error) throw error

  return data
}
