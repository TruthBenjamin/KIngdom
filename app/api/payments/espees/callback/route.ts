import { NextRequest, NextResponse } from 'next/server'
import { paymentGateway } from '@/lib/payments/gateway'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { Json } from '@/types/database'

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')
}

function paymentRefFromUrl(url: URL) {
  return (
    url.searchParams.get('payment_ref') ||
    url.searchParams.get('paymentRef') ||
    url.searchParams.get('payment_reference') ||
    url.searchParams.get('ref') ||
    url.searchParams.get('id') ||
    url.searchParams.get('payment_id')
  )
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? null)) as Json
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const orderId = url.searchParams.get('orderId') || url.searchParams.get('order_id')
  const orderUrl = orderId ? `${appUrl()}/dashboard/orders/${orderId}` : `${appUrl()}/dashboard/payments`

  if (!orderId) {
    return NextResponse.redirect(`${orderUrl}?payment=needs-verification`)
  }

  const supabase = createSupabaseAdminClient()

  try {
    let paymentRef = paymentRefFromUrl(url)

    if (!paymentRef) {
      const { data: intent, error: intentError } = await supabase
        .from('payment_intents')
        .select('provider_payment_id')
        .eq('order_id', orderId)
        .eq('provider', 'espees')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (intentError) throw new Error(intentError.message)
      paymentRef = intent?.provider_payment_id || null
    }

    if (!paymentRef) {
      return NextResponse.redirect(`${orderUrl}?payment=needs-verification`)
    }

    const confirmation = await paymentGateway.confirm({
      orderId,
      reference: paymentRef,
      method: 'loveworld_espees',
      providerPaymentId: paymentRef,
    })

    if (!confirmation.paid) {
      await supabase
        .from('payment_intents')
        .update({
          status: 'pending',
          metadata: {
            callback: true,
            raw: toJson(confirmation.raw),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('provider', 'espees')
        .eq('provider_payment_id', paymentRef)

      return NextResponse.redirect(`${orderUrl}?payment=pending`)
    }

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

    await supabase
      .from('payment_intents')
      .update({
        status: 'approved',
        metadata: {
          callback: true,
          raw: toJson(confirmation.raw),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('provider', 'espees')
      .eq('provider_payment_id', paymentRef)

    return NextResponse.redirect(`${orderUrl}?payment=confirmed`)
  } catch (error) {
    console.error(error)
    return NextResponse.redirect(`${orderUrl}?payment=failed`)
  }
}
