'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bell, Loader2, ShieldCheck, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCurrentUser } from '@/hooks/use-current-user'

type BuyerProfile = {
  organization_name: string | null
  buyer_type: 'individual' | 'church' | 'ministry' | 'business'
  project_interests: string[]
  default_project_brief: string | null
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected'
  profile_completion_score: number
}

function completionScore(name: string, profile: BuyerProfile) {
  let score = 20
  if (name.trim()) score += 20
  if (profile.organization_name?.trim()) score += 15
  if (profile.project_interests.length) score += 20
  if (profile.default_project_brief?.trim()) score += 25
  return Math.min(score, 100)
}

export default function BuyerSettingsPage() {
  const router = useRouter()
  const { user, loading, supabase } = useCurrentUser()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<BuyerProfile>({
    organization_name: '',
    buyer_type: 'individual',
    project_interests: [],
    default_project_brief: '',
    verification_status: 'unverified',
    profile_completion_score: 10,
  })

  const loadProfile = useCallback(async () => {
    if (!user) return

    setName(user.fullName || '')
    setEmail(user.email || '')

    const { data, error } = await supabase
      .from('buyer_profiles')
      .select('organization_name, buyer_type, project_interests, default_project_brief, verification_status, profile_completion_score')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      toast.error('Could not load buyer profile')
      return
    }

    if (data) setProfile(data as BuyerProfile)
  }, [supabase, user])

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, router, user])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return

    setSaving(true)
    const nextProfile = {
      ...profile,
      project_interests: profile.project_interests.map((item) => item.trim()).filter(Boolean),
      profile_completion_score: completionScore(name, profile),
    }

    const [userResult, profileResult] = await Promise.all([
      supabase.from('users').update({ full_name: name }).eq('id', user.id),
      supabase.from('buyer_profiles').upsert(
        {
          user_id: user.id,
          ...nextProfile,
        },
        { onConflict: 'user_id' }
      ),
    ])

    setSaving(false)
    if (userResult.error || profileResult.error) {
      toast.error(userResult.error?.message || profileResult.error?.message || 'Could not save settings')
      return
    }

    setProfile(nextProfile)
    toast.success('Buyer profile saved')
  }

  if (loading || !user) {
    return (
      <div className='grid min-h-screen place-items-center'>
        <Loader2 className='h-8 w-8 animate-spin text-[#b97822]' />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#f7f3ec] px-3 py-4 sm:px-6 sm:py-8'>
      <div className='mx-auto max-w-5xl'>
        <Link href='/dashboard/buyer' className='mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#8a5a18]'>
          <ArrowLeft className='h-4 w-4' />
          Back to dashboard
        </Link>

        <div className='rounded-lg border border-[#eadfce] bg-white p-5 shadow-[0_18px_60px_rgba(33,24,10,0.08)] sm:p-8'>
          <div className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div>
              <h1 className='text-3xl font-extrabold text-[#101828] sm:text-4xl'>Buyer onboarding</h1>
              <p className='mt-2 text-sm text-[#667085]'>Complete the profile used for saved services, creator messages, and future order briefs.</p>
            </div>
            <div className='grid h-12 w-12 place-items-center rounded-lg bg-[#101828] text-[#edbd68]'>
              <User className='h-6 w-6' />
            </div>
          </div>

          <form onSubmit={handleSave} className='grid gap-6 lg:grid-cols-[1fr_320px]'>
            <section className='space-y-5 rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <Label htmlFor='name'>Display name</Label>
                  <Input id='name' value={name} onChange={(event) => setName(event.target.value)} className='mt-2 bg-white' />
                </div>
                <div>
                  <Label htmlFor='email'>Email</Label>
                  <Input id='email' type='email' value={email} disabled className='mt-2 bg-white' />
                </div>
              </div>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <Label htmlFor='organization'>Organization</Label>
                  <Input
                    id='organization'
                    value={profile.organization_name || ''}
                    onChange={(event) => setProfile((current) => ({ ...current, organization_name: event.target.value }))}
                    className='mt-2 bg-white'
                  />
                </div>
                <div>
                  <Label htmlFor='buyerType'>Buyer type</Label>
                  <select
                    id='buyerType'
                    value={profile.buyer_type}
                    onChange={(event) => setProfile((current) => ({ ...current, buyer_type: event.target.value as BuyerProfile['buyer_type'] }))}
                    className='mt-2 h-10 w-full rounded-lg border border-[#eadfce] bg-white px-3 text-sm'
                  >
                    <option value='individual'>Individual</option>
                    <option value='church'>Church</option>
                    <option value='ministry'>Ministry</option>
                    <option value='business'>Business</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor='interests'>Project interests</Label>
                <Input
                  id='interests'
                  value={profile.project_interests.join(', ')}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      project_interests: event.target.value.split(','),
                    }))
                  }
                  placeholder='design, video, worship, web'
                  className='mt-2 bg-white'
                />
              </div>
              <div>
                <Label htmlFor='brief'>Default project brief</Label>
                <Textarea
                  id='brief'
                  value={profile.default_project_brief || ''}
                  onChange={(event) => setProfile((current) => ({ ...current, default_project_brief: event.target.value }))}
                  className='mt-2 min-h-32 bg-white'
                />
              </div>
              <Button type='submit' className='w-full bg-[#101828] text-white hover:bg-[#1f2937] sm:w-auto' disabled={saving}>
                {saving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Save profile
              </Button>
            </section>

            <aside className='space-y-4'>
              <div className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
                <div className='mb-4 flex items-center gap-2'>
                  <Bell className='h-5 w-5 text-[#b97822]' />
                  <h2 className='font-extrabold'>Communication</h2>
                </div>
                <p className='text-sm leading-6 text-[#667085]'>
                  Message and order alerts will be connected here before public launch.
                </p>
              </div>
              <div className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
                <div className='mb-3 flex items-center gap-2'>
                  <ShieldCheck className='h-5 w-5 text-[#15803d]' />
                  <h2 className='font-extrabold'>Verification</h2>
                </div>
                <p className='text-sm font-bold capitalize'>{profile.verification_status}</p>
                <div className='mt-4 h-2 overflow-hidden rounded-full bg-[#eadfce]'>
                  <div className='h-full bg-[#15803d]' style={{ width: `${profile.profile_completion_score}%` }} />
                </div>
                <p className='mt-2 text-xs text-[#667085]'>{profile.profile_completion_score}% profile completion</p>
              </div>
            </aside>
          </form>
        </div>
      </div>
    </div>
  )
}
