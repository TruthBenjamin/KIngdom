import { NextRequest, NextResponse } from 'next/server'
import { paymentGateway } from '@/lib/payments/gateway'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { Json } from '@/types/database'

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')
}

function paymentIdFromUrl(url: URL) {
  return url.searchParams.get('payment_id') || url.searchParams.get('paymentId') || url.searchParams.get('id')
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? null)) as Json
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const orderId = url.searchParams.get('orderId')
  const paymentId = paymentIdFromUrl(url)
  const orderUrl = orderId ? `${appUrl()}/dashboard/orders/${orderId}` : `${appUrl()}/dashboard/payments`

  if (!orderId || !paymentId) {
    return NextResponse.redirect(`${orderUrl}?payment=needs-verification`)
  }

  try {
    const confirmation = await paymentGateway.confirm({
      orderId,
      reference: `LWE-${orderId}`,
      method: 'loveworld_espees',
      providerPaymentId: paymentId,
    })

    if (!confirmation.paid) {
      return NextResponse.redirect(`${orderUrl}?payment=pending`)
    }

    const supabase = createSupabaseAdminClient()
    const { error } = await supabase.rpc('confirm_provider_payment', {
      target_order_id: orderId,
      target_payment_method: 'loveworld_espees',
      target_provider: confirmation.provider,
      target_reference: confirmation.reference,
      target_metadata: {
        providerPaymentId: confirmation.providerPaymentId,
        callback: true,
        raw: toJson(confirmation.raw),
      },
    })

    if (error) throw new Error(error.message)

    return NextResponse.redirect(`${orderUrl}?payment=confirmed`)
  } catch (error) {
    console.error(error)
    return NextResponse.redirect(`${orderUrl}?payment=failed`)
  }
}
