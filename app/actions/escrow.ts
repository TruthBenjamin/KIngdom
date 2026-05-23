'use server'

import { revalidatePath } from 'next/cache'
import { paymentGateway } from '@/lib/payments/gateway'
import { createServerActionClient } from '@/lib/supabase-server'

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

export async function createMarketplaceOrderAction(accessToken: string, serviceId: string) {
  const { supabase } = await requireUser(accessToken)
  const { data, error } = await supabase.rpc('create_marketplace_order', {
    target_service_id: serviceId,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/orders')
  return data
}

export async function confirmSimulatedPaymentAction(accessToken: string, orderId: string, amount: number) {
  const { supabase } = await requireUser(accessToken)
  const intent = await paymentGateway.createIntent({ orderId, amount })
  const confirmation = await paymentGateway.confirm({
    orderId,
    reference: intent.reference,
  })

  if (!confirmation.paid) {
    throw new Error('Simulated payment was not confirmed')
  }

  const { data, error } = await supabase.rpc('confirm_simulated_payment', {
    target_order_id: orderId,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/payments')
  return data
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

