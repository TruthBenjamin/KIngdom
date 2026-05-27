import { SupabaseClient, User } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export type AppRole = 'buyer' | 'seller' | 'admin'

export type AppSessionUser = {
  id: string
  email: string | null
  role: AppRole
  fullName: string | null
  avatarUrl: string | null
  authUser: User
}

export async function getSessionUser(supabase: SupabaseClient<Database>): Promise<AppSessionUser | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('email, full_name, avatar_url, role')
    .eq('id', user.id)
    .maybeSingle()

  const metadataRole = user.user_metadata?.role
  const role = (profile?.role || metadataRole || 'buyer') as AppRole

  return {
    id: user.id,
    email: profile?.email || user.email || null,
    role,
    fullName: profile?.full_name || user.user_metadata?.full_name || null,
    avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || null,
    authUser: user,
  }
}

export function dashboardPathForRole(role: AppRole) {
  if (role === 'admin') return '/dashboard/admin'
  if (role === 'seller') return '/dashboard/seller'
  return '/dashboard/buyer'
}
