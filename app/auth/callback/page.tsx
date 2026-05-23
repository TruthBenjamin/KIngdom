'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

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
        // Get user profile to determine role
        const {
          data: { user },
        } = await supabase.auth.getUser()
        const role = user?.user_metadata?.role || 'buyer'
        
        // Redirect to appropriate dashboard
        if (role === 'seller') {
          router.push('/dashboard/seller')
        } else {
          router.push('/dashboard/buyer')
        }
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
