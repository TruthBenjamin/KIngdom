'use server'

import { revalidatePath } from 'next/cache'
import { createServerActionClient } from '@/lib/supabase-server'

async function requireSellerClient(accessToken: string) {
  const supabase = createServerActionClient(accessToken)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('You must be signed in to manage seller workflows')
  }

  return supabase
}

function actionFailure(error: unknown, fallback: string) {
  return {
    ok: false,
    error: error instanceof Error ? error.message : fallback,
  }
}

export type SellerProfileInput = {
  headline?: string | null
  location?: string | null
  responseTimeMinutes?: number | null
  isAcceptingOrders?: boolean
  categorySpecializations?: string[]
  portfolioUrls?: string[]
  verificationNote?: string | null
}

export type SellerServiceInput = {
  serviceId?: string | null
  title: string
  description: string
  category: string
  categorySlug: string
  price: number
  deliveryDays: number
  revisionCount: number
  requirements?: string | null
  mediaUrl?: string | null
  portfolioUrls?: string[]
  packageSummary?: string | null
  cancellationPolicy?: string | null
  tags?: string[]
  submitForReview: boolean
}

export async function activateSellerAccountAction(accessToken: string, input: SellerProfileInput) {
  try {
    const supabase = await requireSellerClient(accessToken)
    const { data, error } = await supabase.rpc('activate_seller_account', {
      seller_headline: input.headline ?? null,
      seller_location: input.location ?? null,
      seller_response_time_minutes: input.responseTimeMinutes ?? 1440,
      seller_category_specializations: input.categorySpecializations ?? [],
      seller_portfolio_urls: input.portfolioUrls ?? [],
      seller_verification_note: input.verificationNote ?? null,
    })

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/seller')
    return { ok: true, data }
  } catch (error) {
    return actionFailure(error, 'Could not activate seller account')
  }
}

export async function upsertSellerProfileAction(accessToken: string, input: SellerProfileInput) {
  try {
    const supabase = await requireSellerClient(accessToken)
    const { data, error } = await supabase.rpc('upsert_seller_profile', {
      seller_headline: input.headline ?? null,
      seller_location: input.location ?? null,
      seller_response_time_minutes: input.responseTimeMinutes ?? 1440,
      seller_is_accepting_orders: input.isAcceptingOrders ?? true,
      seller_category_specializations: input.categorySpecializations ?? [],
      seller_portfolio_urls: input.portfolioUrls ?? [],
      seller_verification_note: input.verificationNote ?? null,
    })

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/seller')
    revalidatePath('/marketplace')
    return { ok: true, data }
  } catch (error) {
    return actionFailure(error, 'Could not save seller profile')
  }
}

export async function upsertSellerServiceAction(accessToken: string, input: SellerServiceInput) {
  try {
    const supabase = await requireSellerClient(accessToken)
    const { data, error } = await supabase.rpc('upsert_seller_service', {
      target_service_id: input.serviceId ?? null,
      service_title: input.title,
      service_description: input.description,
      service_category: input.category,
      service_category_slug: input.categorySlug,
      service_price: input.price,
      service_delivery_days: input.deliveryDays,
      service_revision_count: input.revisionCount,
      service_requirements: input.requirements ?? null,
      service_media_url: input.mediaUrl ?? null,
      service_portfolio_urls: input.portfolioUrls ?? [],
      service_package_summary: input.packageSummary ?? null,
      service_cancellation_policy: input.cancellationPolicy ?? null,
      service_tags: input.tags ?? [],
      submit_for_review: input.submitForReview,
    })

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/seller')
    revalidatePath('/marketplace')
    return { ok: true, data }
  } catch (error) {
    return actionFailure(error, 'Could not save service')
  }
}

export async function setSellerServiceVisibilityAction(
  accessToken: string,
  serviceId: string,
  nextIsActive: boolean
) {
  try {
    const supabase = await requireSellerClient(accessToken)
    const { data, error } = await supabase.rpc('set_seller_service_visibility', {
      target_service_id: serviceId,
      next_is_active: nextIsActive,
    })

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/seller')
    revalidatePath('/marketplace')
    return { ok: true, data }
  } catch (error) {
    return actionFailure(error, 'Could not update service')
  }
}
