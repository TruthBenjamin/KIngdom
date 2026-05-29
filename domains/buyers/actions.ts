'use server'

import { revalidatePath } from 'next/cache'
import { createServerActionClient } from '@/lib/supabase-server'

async function requireBuyerClient(accessToken: string) {
  const supabase = createServerActionClient(accessToken)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('You must be signed in to manage buyer workflows')
  }

  return supabase
}

export type BuyerProfileInput = {
  displayName?: string | null
  organizationName?: string | null
  buyerType: 'individual' | 'church' | 'ministry' | 'business'
  projectInterests?: string[]
  defaultProjectBrief?: string | null
}

export async function upsertBuyerProfileAction(accessToken: string, input: BuyerProfileInput) {
  const supabase = await requireBuyerClient(accessToken)
  const { data, error } = await supabase.rpc('upsert_buyer_profile', {
    buyer_display_name: input.displayName ?? null,
    buyer_organization_name: input.organizationName ?? null,
    buyer_kind: input.buyerType,
    buyer_project_interests: input.projectInterests ?? [],
    buyer_default_project_brief: input.defaultProjectBrief ?? null,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/buyer')
  revalidatePath('/dashboard/buyer/settings')
  return data
}

export async function setSavedServiceAction(accessToken: string, serviceId: string, nextSaved: boolean) {
  const supabase = await requireBuyerClient(accessToken)
  const { data, error } = await supabase.rpc('set_saved_service', {
    target_service_id: serviceId,
    next_saved: nextSaved,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/buyer')
  revalidatePath('/dashboard/buyer/saved')
  revalidatePath('/marketplace')
  return data
}
