'use client'

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BadgeCheck, Bell, Briefcase, Camera, CheckCircle2, ClipboardList, Loader2, MessageCircle, ShieldCheck, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCurrentUser } from '@/hooks/use-current-user'
import { upsertBuyerProfileAction } from '@/domains/buyers/actions'

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

async function getAccessToken(supabase: ReturnType<typeof import('@/lib/supabase-client').createClient>) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) throw new Error('Sign in again to continue')
  return session.access_token
}

function actionError(result: unknown) {
  return result && typeof result === 'object' && 'error' in result ? String((result as { error?: string }).error || '') : ''
}

function initials(name?: string | null) {
  return (name || 'KM')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'KM'
}

export default function BuyerSettingsPage() {
  const router = useRouter()
  const { user, loading, supabase } = useCurrentUser()
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
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
    setAvatarUrl(user.avatarUrl || '')

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

    try {
      const token = await getAccessToken(supabase)
      const result = await upsertBuyerProfileAction(token, {
        displayName: name,
        organizationName: nextProfile.organization_name,
        buyerType: nextProfile.buyer_type,
        projectInterests: nextProfile.project_interests,
        defaultProjectBrief: nextProfile.default_project_brief,
      })
      const errorMessage = actionError(result)
      if (errorMessage) throw new Error(errorMessage)

      setProfile(nextProfile)
      toast.success('Buyer profile saved')
    } catch (error: any) {
      toast.error(error.message || 'Could not save settings')
    } finally {
      setSaving(false)
    }
  }

  const uploadProfilePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !user) return

    if (!file.type.startsWith('image/')) {
      toast.error('Choose an image file for your profile picture')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Profile picture must be 5MB or smaller')
      return
    }

    setUploadingAvatar(true)
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${user.id}/profile/avatar-${Date.now()}.${extension}`
      const { error: uploadError } = await supabase.storage.from('marketplace-media').upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('marketplace-media').getPublicUrl(path)
      const publicUrl = data.publicUrl

      const { error: updateUserError } = await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id)
      if (updateUserError) throw updateUserError

      const { error: updateAuthError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl, picture: publicUrl },
      })
      if (updateAuthError) throw updateAuthError

      setAvatarUrl(publicUrl)
      toast.success('Profile picture updated')
    } catch (error: any) {
      toast.error(error.message || 'Could not upload profile picture')
    } finally {
      setUploadingAvatar(false)
    }
  }

  if (loading || !user) {
    return (
      <div className='grid min-h-screen place-items-center'>
        <Loader2 className='h-8 w-8 animate-spin text-[#b97822]' />
      </div>
    )
  }

  const profileScore = completionScore(name, profile)
  const cleanInterests = profile.project_interests.map((item) => item.trim()).filter(Boolean)
  const buyerLabel = profile.buyer_type.replace(/_/g, ' ')
  const readiness = [
    ['Name added', Boolean(name.trim())],
    ['Organization context', Boolean(profile.organization_name?.trim())],
    ['Project interests', cleanInterests.length > 0],
    ['Default brief', Boolean(profile.default_project_brief?.trim())],
  ] as const

  return (
    <div className='min-h-screen bg-[#f8fafc] px-3 py-4 sm:px-6 sm:py-8 content-fade-in'>
      <div className='mx-auto max-w-6xl'>
        <Link href='/dashboard/buyer' className='mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#8a5a18]'>
          <ArrowLeft className='h-4 w-4' />
          Back to dashboard
        </Link>

        <div className='rounded-lg border border-[#d8c9b5] bg-white shadow-[0_18px_60px_rgba(33,24,10,0.08)]'>
          <div className='border-b border-[#eadfce] p-5 sm:p-8'>
            <div className='flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between'>
              <div>
                <p className='text-xs font-extrabold uppercase tracking-[0.16em] text-[#8a5a18]'>Buyer profile</p>
                <h1 className='mt-2 text-3xl font-extrabold tracking-normal text-[#101828] sm:text-4xl'>Set up your hiring profile</h1>
                <p className='mt-3 max-w-2xl text-sm leading-6 text-[#667085]'>
                  Give creators the context they need before a project starts: who you are, what you usually buy, and the brief details you repeat often.
                </p>
              </div>
              <div className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-4'>
                <div className='flex items-center gap-3'>
                  <div className='grid h-11 w-11 place-items-center rounded-md bg-[#101828] text-[#f0c56a]'>
                    <ClipboardList className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-xs font-bold text-[#667085]'>Profile readiness</p>
                    <p className='text-2xl font-extrabold text-[#101828]'>{profileScore}%</p>
                  </div>
                </div>
                <div className='mt-3 h-2 overflow-hidden rounded-full bg-[#eadfce]'>
                  <div className='h-full bg-[#15803d]' style={{ width: `${profileScore}%` }} />
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className='grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]'>
            <section className='space-y-5 p-5 sm:p-8'>
              <div className='flex flex-col gap-4 rounded-lg border border-[#eadfce] bg-white p-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex min-w-0 items-center gap-4'>
                  <Avatar
                    src={avatarUrl || undefined}
                    fallback={initials(name || email)}
                    alt={name || email || 'Profile picture'}
                    className='h-16 w-16 bg-[#f0c56a] text-[#06172f]'
                  />
                  <div className='min-w-0'>
                    <p className='text-sm font-extrabold text-[#101828]'>Profile photo</p>
                    <p className='mt-1 text-xs leading-5 text-[#667085]'>
                      This appears on your dashboard, messages, and marketplace profile.
                    </p>
                  </div>
                </div>
                <label className='inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-[#101828] bg-white px-4 text-sm font-extrabold text-[#101828] transition hover:bg-[#f8fafc]'>
                  {uploadingAvatar ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Camera className='mr-2 h-4 w-4' />}
                  Upload photo
                  <input type='file' accept='image/*' className='sr-only' disabled={uploadingAvatar} onChange={uploadProfilePhoto} />
                </label>
              </div>
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
                    placeholder='Church, ministry, business, or team name'
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
                  placeholder='brand design, video editing, worship audio, website'
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
                  placeholder='Share your typical goals, audience, tone, deadlines, file needs, and approval process.'
                />
              </div>
              <Button type='submit' className='w-full bg-[#101828] text-white hover:bg-[#1f2937] sm:w-auto' disabled={saving}>
                {saving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Save profile
              </Button>
            </section>

            <aside className='space-y-4 border-t border-[#eadfce] bg-[#fffdf8] p-5 sm:p-8 lg:border-l lg:border-t-0'>
              <div className='rounded-lg border border-[#eadfce] bg-white p-5'>
                <div className='flex items-center gap-3'>
                  <Avatar src={avatarUrl || undefined} fallback={initials(name || email)} alt={name || email || 'Buyer'} className='h-14 w-14 bg-[#f0c56a] text-[#06172f]' />
                  <div className='min-w-0'>
                    <p className='truncate text-lg font-extrabold text-[#101828]'>{name || 'Your buyer profile'}</p>
                    <p className='truncate text-xs font-bold capitalize text-[#8a5a18]'>{buyerLabel}</p>
                  </div>
                </div>
                <div className='mt-5 rounded-md bg-[#fffdf8] p-3'>
                  <p className='text-xs font-bold text-[#667085]'>Organization</p>
                  <p className='mt-1 truncate text-sm font-extrabold'>{profile.organization_name || 'Not added yet'}</p>
                </div>
                <div className='mt-3 rounded-md bg-[#fffdf8] p-3'>
                  <p className='text-xs font-bold text-[#667085]'>Common project brief</p>
                  <p className='mt-1 line-clamp-4 text-sm leading-6 text-[#344054]'>
                    {profile.default_project_brief || 'Add a default brief so creators understand your usual goals before a conversation starts.'}
                  </p>
                </div>
                <div className='mt-4 flex flex-wrap gap-2'>
                  {(cleanInterests.length ? cleanInterests : ['Add interests']).slice(0, 6).map((interest) => (
                    <span key={interest} className='rounded-full bg-[#f7f1e7] px-3 py-1 text-xs font-bold text-[#667085]'>
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              <div className='rounded-lg border border-[#eadfce] bg-white p-5'>
                <div className='mb-4 flex items-center gap-2'>
                  <BadgeCheck className='h-5 w-5 text-[#15803d]' />
                  <h2 className='font-extrabold'>Readiness checklist</h2>
                </div>
                <div className='space-y-3'>
                  {readiness.map(([label, done]) => (
                    <div key={label} className='flex items-center justify-between gap-3 text-sm'>
                      <span className='font-semibold text-[#344054]'>{label}</span>
                      {done ? <CheckCircle2 className='h-4 w-4 text-[#15803d]' /> : <span className='h-2 w-2 rounded-full bg-[#d8c9b5]' />}
                    </div>
                  ))}
                </div>
              </div>

              <div className='rounded-lg border border-[#eadfce] bg-white p-5'>
                <div className='mb-4 flex items-center gap-2'>
                  <MessageCircle className='h-5 w-5 text-[#8a5a18]' />
                  <h2 className='font-extrabold'>Hiring flow</h2>
                </div>
                <p className='text-sm leading-6 text-[#667085]'>
                  Your profile context follows saved services, creator messages, and checkout briefs so repeat hiring is faster.
                </p>
              </div>

              <div className='rounded-lg border border-[#eadfce] bg-white p-5'>
                <div className='mb-3 flex items-center gap-2'>
                  <ShieldCheck className='h-5 w-5 text-[#15803d]' />
                  <h2 className='font-extrabold'>Verification</h2>
                </div>
                <p className='text-sm font-bold capitalize'>{profile.verification_status}</p>
                <div className='mt-4 h-2 overflow-hidden rounded-full bg-[#eadfce]'>
                  <div className='h-full bg-[#15803d]' style={{ width: `${profileScore}%` }} />
                </div>
                <p className='mt-2 text-xs text-[#667085]'>{profileScore}% profile completion</p>
              </div>
            </aside>
          </form>
        </div>
      </div>
    </div>
  )
}
