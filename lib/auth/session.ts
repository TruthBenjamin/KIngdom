import { SupabaseClient, User } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export type AppRole = 'buyer' | 'seller' | 'admin' | 'moderator'

export type AppSessionUser = {
  id: string
  email: string | null
  role: AppRole
  fullName: string | null
  avatarUrl: string | null
  needsRoleOnboarding: boolean
  authUser: User
}

export async function getSessionUser(
  supabase: SupabaseClient<Database>,
  options: { ensureProfile?: boolean; adminEmailFallback?: string } = {}
): Promise<AppSessionUser | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  if (options.ensureProfile !== false) {
    const { error: ensureError } = await supabase.rpc('ensure_current_user_profile')
    if (ensureError) {
      console.error(ensureError)
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('email, full_name, avatar_url, role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error(profileError)
  }

  const metadataRole = user.user_metadata?.role
  const isFallbackAdmin =
    Boolean(options.adminEmailFallback) &&
    user.email?.toLowerCase() === options.adminEmailFallback?.toLowerCase()
  const role = (profile?.role || metadataRole || (isFallbackAdmin ? 'admin' : 'buyer')) as AppRole
  const needsRoleOnboarding = !metadataRole && (!profile?.role || profile.role === 'buyer')

  return {
    id: user.id,
    email: profile?.email || user.email || null,
    role,
    fullName: profile?.full_name || user.user_metadata?.full_name || null,
    avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || null,
    needsRoleOnboarding,
    authUser: user,
  }
}

export function dashboardPathForRole(role: AppRole) {
  if (role === 'admin' || role === 'moderator') return '/dashboard/admin'
  if (role === 'seller') return '/dashboard/seller'
  return '/dashboard/buyer'
}
