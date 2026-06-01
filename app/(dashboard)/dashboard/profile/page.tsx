'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'

export default function DashboardProfilePage() {
  const router = useRouter()
  const { user, loading } = useCurrentUser()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login?next=/dashboard/profile')
      return
    }

    router.replace(user.role === 'seller' ? '/dashboard/seller#seller-profile' : '/dashboard/buyer/settings')
  }, [loading, router, user])

  return (
    <div className='grid min-h-screen place-items-center bg-white px-4 text-center'>
      <div>
        <Loader2 className='mx-auto h-8 w-8 animate-spin text-[#b97822]' />
        <p className='mt-3 text-sm font-semibold text-[#667085]'>Opening your profile...</p>
      </div>
    </div>
  )
}
