'use server'

import { revalidatePath } from 'next/cache'
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

export async function submitCompletedOrderReviewAction(
  accessToken: string,
  input: {
    orderId: string
    rating: number
    comment?: string | null
  }
) {
  const { supabase } = await requireUser(accessToken)
  const { data, error } = await supabase.rpc('submit_completed_order_review', {
    target_order_id: input.orderId,
    target_rating: input.rating,
    target_comment: input.comment ?? null,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/payments')
  revalidatePath('/marketplace')
  return data
}
