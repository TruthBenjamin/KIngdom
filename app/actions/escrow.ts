'use server'

import { revalidatePath } from 'next/cache'
import { paymentGateway, type PaymentMethod } from '@/lib/payments/gateway'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { createServerActionClient } from '@/lib/supabase-server'
import { Json } from '@/types/database'

async function requireUser(accessToken: string) {
  const supabase = createServerActionClient(accessToken)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('You must be signed in to perform this action')
  }

  return { supabase, user }
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? null)) as Json
}

export async function createMarketplaceOrderAction(
  accessToken: string,
  serviceId: string,
  input?: {
    requirements?: string | null
    scopeConfirmation?: string | null
    termsAccepted?: boolean
    document?: {
      fileUrl: string
      fileName: string
      fileType?: string | null
      fileSize?: number | null
    } | null
  }
) {
  const { supabase } = await requireUser(accessToken)
  const { data, error } = await supabase.rpc('create_marketplace_order', {
    target_service_id: serviceId,
    buyer_requirements: input?.requirements ?? null,
    scope_confirmation: input?.scopeConfirmation ?? null,
    terms_accepted: input?.termsAccepted ?? false,
  })

  if (error) throw new Error(error.message)

  if (input?.document?.fileUrl && input.document.fileName) {
    const { error: documentError } = await supabase.rpc('add_order_document', {
      target_order_id: data,
      document_file_url: input.document.fileUrl,
      document_file_name: input.document.fileName,
      document_file_type: input.document.fileType ?? null,
      document_file_size: input.document.fileSize ?? null,
    })

    if (documentError) throw new Error(documentError.message)
  }

  revalidatePath('/dashboard/orders')
  return data
}

export async function requestOrderCancellationAction(accessToken: string, orderId: string, reason: string) {
  const { supabase } = await requireUser(accessToken)
  const { data, error } = await supabase.rpc('request_order_cancellation', {
    target_order_id: orderId,
    reason,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/payments')
  revalidatePath(`/dashboard/orders/${orderId}`)
  return data
}

export async function openOrderDisputeAction(accessToken: string, orderId: string, reason: string) {
  const { supabase } = await requireUser(accessToken)
  const { data, error } = await supabase.rpc('open_order_dispute', {
    target_order_id: orderId,
    reason,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/payments')
  revalidatePath(`/dashboard/orders/${orderId}`)
  return data
}

export async function confirmBetaPaymentAction(accessToken: string, orderId: string, amount: number, method: PaymentMethod = 'beta_card') {
  const { supabase, user } = await requireUser(accessToken)
  const intent = await paymentGateway.createIntent({ orderId, amount, method, customerEmail: user.email })

  if (intent.redirectUrl) {
    if (intent.providerPaymentId) {
      const admin = createSupabaseAdminClient()
      const { error: intentError } = await admin.from('payment_intents').upsert(
        {
          order_id: orderId,
          provider: intent.provider,
          method: intent.method,
          reference: intent.reference,
          provider_payment_id: intent.providerPaymentId,
          status: 'created',
          amount,
          currency: intent.currency,
          redirect_url: intent.redirectUrl,
          metadata: {
            createdBy: user.id,
            raw: toJson(intent.raw),
          },
        },
        { onConflict: 'provider,provider_payment_id' }
      )

      if (intentError) throw new Error(intentError.message)
    }

    return {
      status: 'redirect' as const,
      redirectUrl: intent.redirectUrl,
      providerPaymentId: intent.providerPaymentId,
      reference: intent.reference,
    }
  }

  const confirmation = await paymentGateway.confirm({
    orderId,
    reference: intent.reference,
    method: intent.method,
  })

  if (!confirmation.paid) {
    throw new Error('Beta payment was not confirmed')
  }

  const { data, error } = await supabase.rpc('confirm_beta_payment', {
    target_order_id: orderId,
    target_payment_method: confirmation.method,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/payments')
  revalidatePath(`/dashboard/orders/${orderId}`)
  return { status: 'confirmed' as const, data }
}

export async function deliverMarketplaceOrderAction(
  accessToken: string,
  input: {
    orderId: string
    message: string
    fileUrl?: string | null
    fileName?: string | null
  }
) {
  const { supabase } = await requireUser(accessToken)
  const { data, error } = await supabase.rpc('deliver_marketplace_order', {
    target_order_id: input.orderId,
    delivery_message: input.message,
    delivery_file_url: input.fileUrl ?? null,
    delivery_file_name: input.fileName ?? null,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/messages')
  return data
}

export async function acceptMarketplaceDeliveryAction(accessToken: string, orderId: string) {
  const { supabase } = await requireUser(accessToken)
  const { data, error } = await supabase.rpc('accept_marketplace_delivery', {
    target_order_id: orderId,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/payments')
  return data
}

export async function requestOrderRevisionAction(accessToken: string, orderId: string, message: string) {
  const { supabase } = await requireUser(accessToken)
  const { data, error } = await supabase.rpc('request_order_revision', {
    target_order_id: orderId,
    revision_message: message,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/messages')
  return data
}

export async function requestWithdrawalAction(
  accessToken: string,
  input: {
    amount: number
    bankName: string
    accountName: string
    accountNumber: string
  }
) {
  const { supabase } = await requireUser(accessToken)
  const { data, error } = await supabase.rpc('request_withdrawal', {
    withdrawal_amount: input.amount,
    target_bank_name: input.bankName,
    target_account_name: input.accountName,
    target_account_number: input.accountNumber,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/payments')
  revalidatePath('/dashboard/admin')
  return data
}

export async function approveWithdrawalAction(accessToken: string, withdrawalId: string, markPaid = false) {
  const { supabase } = await requireUser(accessToken)
  const { data, error } = await supabase.rpc('approve_withdrawal', {
    target_withdrawal_id: withdrawalId,
    mark_paid: markPaid,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/admin')
  return data
}

export async function rejectWithdrawalAction(accessToken: string, withdrawalId: string, note?: string) {
  const { supabase } = await requireUser(accessToken)
  const { data, error } = await supabase.rpc('reject_withdrawal', {
    target_withdrawal_id: withdrawalId,
    rejection_note: note ?? null,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/payments')
  return data
}
