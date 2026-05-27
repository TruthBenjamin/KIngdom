'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { dashboardPathForRole, getSessionUser } from '@/lib/auth/session'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        router.push('/login')
        return
      }

      if (session) {
        const user = await getSessionUser(supabase)
        router.push(dashboardPathForRole(user?.role || 'buyer'))
      } else {
        router.push('/login')
      }
    }

    handleCallback()
  }, [supabase, router])

  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4' />
        <p className='text-muted-foreground'>Authenticating...</p>
      </div>
    </div>
  )
}
