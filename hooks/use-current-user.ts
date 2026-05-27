'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { AppSessionUser, getSessionUser } from '@/lib/auth/session'

export function useCurrentUser() {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<AppSessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadUser = async () => {
      const sessionUser = await getSessionUser(supabase)
      if (!mounted) return
      setUser(sessionUser)
      setLoading(false)
    }

    void loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadUser()
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  return { user, loading, supabase }
}
