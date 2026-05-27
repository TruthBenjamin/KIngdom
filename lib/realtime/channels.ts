export function userScopedChannel(scope: string, userId: string) {
  return `${scope}:user:${userId}`
}

export function conversationChannel(conversationId: string) {
  return `conversation:${conversationId}`
}

export function orderChannel(orderId: string) {
  return `order:${orderId}`
}

export function userFilter(userId: string) {
  return `user_id=eq.${userId}`
}
