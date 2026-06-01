import 'server-only'
import crypto from 'crypto'

export function verifyKingsPayWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env.KINGSPAY_GS_WEBHOOK_SECRET || process.env.KINGSPAY_GS_SECRET_KEY || process.env.KINGSPAY_SECRET_KEY
  if (!secret || !signature) return false

  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
  } catch {
    return false
  }
}
