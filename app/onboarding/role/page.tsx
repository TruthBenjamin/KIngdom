'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase-client'
import { AppRole, dashboardPathForRole } from '@/lib/auth/session'

type RoleChoice = Exclude<AppRole, 'admin'>

export default function RoleOnboardingPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [role, setRole] = useState<RoleChoice>('buyer')
  const [saving, setSaving] = useState(false)

  const saveRole = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setSaving(false)
      router.push('/login')
      return
    }

    const [metadataResult, userResult, profileResult, sellerResult, buyerResult] = await Promise.all([
      supabase.auth.updateUser({ data: { role } }),
      supabase.from('users').upsert(
        {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          role,
        },
        { onConflict: 'id' }
      ),
      supabase.from('profiles').upsert({ user_id: user.id, is_seller: role === 'seller' }, { onConflict: 'user_id' }),
      role === 'seller'
        ? supabase.from('seller_profiles').upsert({ user_id: user.id, profile_completion_score: 15 }, { onConflict: 'user_id' })
        : Promise.resolve({ error: null }),
      supabase.from('buyer_profiles').upsert({ user_id: user.id, profile_completion_score: 10 }, { onConflict: 'user_id' }),
    ])

    setSaving(false)

    const error =
      metadataResult.error ||
      userResult.error ||
      profileResult.error ||
      sellerResult.error ||
      buyerResult.error

    if (error) {
      toast.error(error.message || 'Could not save your role')
      return
    }

    router.push(dashboardPathForRole(role))
  }

  return (
    <div className='min-h-screen bg-[#f7f3ec] px-4 py-10'>
      <div className='mx-auto max-w-xl rounded-lg border border-[#eadfce] bg-white p-6 shadow-[0_18px_60px_rgba(33,24,10,0.08)] sm:p-8'>
        <div className='mb-6'>
          <p className='text-sm font-bold text-[#8a5a18]'>Account setup</p>
          <h1 className='mt-2 text-3xl font-extrabold text-[#101828]'>Choose how you will use Kingdom</h1>
          <p className='mt-3 text-sm leading-6 text-[#667085]'>
            Google sign-in does not tell us whether you are hiring or selling, so choose the role that matches your first workflow.
          </p>
        </div>

        <form onSubmit={saveRole} className='space-y-4'>
          {[
            ['buyer', 'Hire creators', 'Browse services, save options, message sellers, and manage orders.'],
            ['seller', 'Offer services', 'Set up a creator profile, publish services, receive messages, and manage orders.'],
          ].map(([value, title, description]) => (
            <label
              key={value}
              className={`block cursor-pointer rounded-lg border p-4 transition ${
                role === value ? 'border-[#d8952f] bg-[#fff8ea]' : 'border-[#eadfce] bg-[#fffdf8] hover:bg-white'
              }`}
            >
              <span className='flex items-start gap-3'>
                <input
                  type='radio'
                  name='role'
                  value={value}
                  checked={role === value}
                  onChange={() => setRole(value as RoleChoice)}
                  className='mt-1 h-4 w-4'
                />
                <span>
                  <span className='block font-extrabold'>{title}</span>
                  <span className='mt-1 block text-sm leading-6 text-[#667085]'>{description}</span>
                </span>
              </span>
            </label>
          ))}

          <Button type='submit' className='h-11 w-full bg-[#101828] text-white hover:bg-[#1f2937]' disabled={saving}>
            {saving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Continue
          </Button>
        </form>
      </div>
    </div>
  )
}
