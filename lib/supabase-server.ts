import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const fallbackSupabaseUrl = 'http://127.0.0.1:54321'
const fallbackSupabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-build-safe-anon-key'

export function createServerActionClient(accessToken: string) {
  if (!accessToken) {
    throw new Error('Missing access token')
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackSupabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fallbackSupabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  )
}
