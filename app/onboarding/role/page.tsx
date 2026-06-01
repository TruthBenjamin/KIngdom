'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase-client'
import { dashboardPathForRole } from '@/lib/auth/session'
import { setAccountRoleAction } from '@/domains/onboarding/actions'

type RoleChoice = 'buyer' | 'seller'

export default function RoleOnboardingPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [role, setRole] = useState<RoleChoice>('buyer')
  const [saving, setSaving] = useState(false)

  const saveRole = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      setSaving(false)
      router.push('/login')
      return
    }

    try {
      await setAccountRoleAction(session.access_token, role)
      router.push(dashboardPathForRole(role))
    } catch (error: any) {
      toast.error(error.message || 'Could not save your role')
      setSaving(false)
      return
    }
  }

  return (
    <div className='min-h-screen bg-white px-4 py-10'>
      <div className='mx-auto max-w-xl rounded-lg border border-[#eadfce] bg-white p-6 shadow-[0_18px_60px_rgba(33,24,10,0.08)] sm:p-8'>
        <div className='mb-6'>
          <h1 className='text-3xl font-extrabold text-[#101828]'>Choose how you will use Kingdom</h1>
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
