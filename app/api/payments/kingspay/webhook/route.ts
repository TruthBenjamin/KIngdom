import { NextRequest, NextResponse } from 'next/server'
import { paymentGateway } from '@/lib/payments/gateway'
import { verifyKingsPayWebhookSignature } from '@/lib/payments/kingspay-server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { Json } from '@/types/database'

function readOrderId(payload: any) {
  return (
    payload?.data?.metadata?.orderId ||
    payload?.metadata?.orderId ||
    payload?.orderId ||
    payload?.data?.order_id ||
    payload?.order_id ||
    null
  )
}

function readPaymentId(payload: any) {
  return payload?.data?.payment_id || payload?.data?.id || payload?.payment_id || payload?.id || null
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? null)) as Json
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-kingspay-signature')

  if (!verifyKingsPayWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody)
  const orderId = readOrderId(payload)
  const paymentId = readPaymentId(payload)

  if (!orderId || !paymentId) {
    return NextResponse.json({ error: 'Missing order or payment id' }, { status: 400 })
  }

  const confirmation = await paymentGateway.confirm({
    orderId,
    reference: `LWE-${orderId}`,
    method: 'loveworld_espees',
    providerPaymentId: paymentId,
  })

  if (!confirmation.paid) {
    return NextResponse.json({ ok: true, status: 'pending' })
  }

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.rpc('confirm_provider_payment', {
    target_order_id: orderId,
    target_payment_method: 'loveworld_espees',
    target_provider: confirmation.provider,
    target_reference: confirmation.reference,
    target_metadata: {
      providerPaymentId: confirmation.providerPaymentId,
      webhook: true,
      payload: toJson(payload),
      raw: toJson(confirmation.raw),
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, status: 'confirmed' })
}
