'use server'

import { createServerActionClient } from '@/lib/supabase-server'

type OnboardingRole = 'buyer' | 'seller'

export async function setAccountRoleAction(accessToken: string, role: OnboardingRole) {
  const supabase = createServerActionClient(accessToken)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('You must be signed in to choose an account role')
  }

  const [metadataResult, roleResult] = await Promise.all([
    supabase.auth.updateUser({ data: { role } }),
    supabase.rpc('set_account_role', { next_role: role }),
  ])

  const error = metadataResult.error || roleResult.error
  if (error) throw new Error(error.message)

  return roleResult.data
}
