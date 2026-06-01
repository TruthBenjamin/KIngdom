'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Briefcase,
  Camera,
  CalendarCheck,
  CreditCard,
  Eye,
  Home,
  Loader2,
  LogOut,
  MessageCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  Upload,
  User,
  Wallet,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useCurrentUser } from '@/hooks/use-current-user'
import { isVideoMedia } from '@/lib/marketplace/media'
import { formatCurrency, formatResponseTime, formatTimeAgo, slugify } from '@/lib/utils'
import {
  activateSellerAccountAction,
  setSellerServiceVisibilityAction,
  upsertSellerProfileAction,
  upsertSellerServiceAction,
} from '@/domains/sellers/actions'

type SellerOrder = {
  id: string
  title: string
  slug?: string | null
  amount: number
  order_status: string
  created_at: string
}

type SellerService = {
  id: string
  title: string
  slug?: string | null
  description?: string
  category?: string
  category_slug?: string
  price: number
  delivery_days?: number
  revision_count?: number
  requirements?: string | null
  media_url?: string | null
  portfolio_urls?: string[]
  package_summary?: string | null
  cancellation_policy?: string | null
  quality_score?: number
  moderation_status?: 'draft' | 'pending_review' | 'active' | 'paused' | 'rejected' | 'archived'
  tags?: string[]
  status: string
  is_active: boolean
}

type SellerProfile = {
  headline: string | null
  location: string | null
  response_time_minutes: number | null
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected'
  profile_completion_score: number
  is_accepting_orders: boolean
  category_specializations: string[]
  portfolio_urls: string[]
  verification_note: string | null
}

type SellerStats = {
  available: number
  pending: number
  activeOrders: number
  completedOrders: number
  services: number
}

type MarketplaceCategory = {
  name: string
  slug: string
}

const menu = [
  { label: 'Dashboard', icon: Home, active: true, href: '#seller-overview' },
  { label: 'Services', icon: Briefcase, href: '#seller-services' },
  { label: 'Orders', icon: CalendarCheck, href: '/dashboard/payments' },
  { label: 'Messages', icon: MessageCircle, href: '/dashboard/messages' },
  { label: 'Earnings', icon: CreditCard, href: '/dashboard/payments' },
  { label: 'Profile', icon: User, href: '#seller-profile' },
]

const responseTimeOptions = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hr', value: 60 },
  { label: '2 hrs', value: 120 },
  { label: '4 hrs', value: 240 },
  { label: '12 hrs', value: 720 },
  { label: '24 hrs', value: 1440 },
]

const defaultCancellationPolicy =
  'Buyer may request cancellation before work begins. Active orders require marketplace review.'

function actionError(result: unknown) {
  return result && typeof result === 'object' && 'error' in result ? String((result as { error?: string }).error || '') : ''
}

async function getAccessToken(supabase: ReturnType<typeof import('@/lib/supabase-client').createClient>) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) throw new Error('Sign in again to continue')
  return session.access_token
}

function commaList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function statusLabel(value?: string | null) {
  if (!value) return 'Draft'
  return value.replace(/_/g, ' ').toLowerCase()
}

export default function SellerDashboard() {
  const router = useRouter()
  const { user, loading, supabase } = useCurrentUser()
  const [stats, setStats] = useState<SellerStats>({
    available: 0,
    pending: 0,
    activeOrders: 0,
    completedOrders: 0,
    services: 0,
  })
  const [orders, setOrders] = useState<SellerOrder[]>([])
  const [services, setServices] = useState<SellerService[]>([])
  const [categories, setCategories] = useState<MarketplaceCategory[]>([])
  const [sellerProfile, setSellerProfile] = useState<SellerProfile>({
    headline: '',
    location: '',
    response_time_minutes: 1440,
    verification_status: 'unverified',
    profile_completion_score: 0,
    is_accepting_orders: true,
    category_specializations: [],
    portfolio_urls: [],
    verification_note: '',
  })
  const [editingService, setEditingService] = useState<SellerService | null>(null)
  const [serviceDraft, setServiceDraft] = useState({
    title: '',
    description: '',
    category: 'General',
    price: '100',
    delivery_days: '3',
    revision_count: '1',
    requirements: '',
    media_url: '',
    portfolio_urls: '',
    package_summary: '',
    cancellation_policy: defaultCancellationPolicy,
    tags: '',
  })
  const [avatarUrl, setAvatarUrl] = useState('')
  const [dataLoading, setDataLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<'profile' | 'service' | null>(null)
  const [sellerActivated, setSellerActivated] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return
    setDataLoading(true)

    const [walletResult, activeOrdersResult, completedOrdersResult, servicesResult, recentOrdersResult, sellerProfileResult, categoriesResult] =
      await Promise.all([
        supabase.from('wallets').select('available_balance, pending_balance').eq('user_id', user.id).maybeSingle(),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('seller_id', user.id).in('order_status', ['ACTIVE', 'DELIVERED', 'REVISION_REQUESTED']),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('seller_id', user.id).eq('order_status', 'COMPLETED'),
        supabase.from('services').select('id, title, slug, description, category, category_slug, price, delivery_days, revision_count, requirements, media_url, portfolio_urls, package_summary, cancellation_policy, quality_score, moderation_status, tags, status, is_active').eq('seller_id', user.id).order('created_at', { ascending: false }).limit(12),
        supabase.from('orders').select('id, title, amount, order_status, created_at').eq('seller_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('seller_profiles').select('headline, location, response_time_minutes, verification_status, profile_completion_score, is_accepting_orders, category_specializations, portfolio_urls, verification_note').eq('user_id', user.id).maybeSingle(),
        supabase.from('categories').select('name, slug').eq('is_active', true).order('sort_order', { ascending: true }),
      ])

    setStats({
      available: walletResult.data?.available_balance || 0,
      pending: walletResult.data?.pending_balance || 0,
      activeOrders: activeOrdersResult.count || 0,
      completedOrders: completedOrdersResult.count || 0,
      services: servicesResult.data?.length || 0,
    })
    setServices((servicesResult.data || []) as SellerService[])
    setOrders((recentOrdersResult.data || []) as SellerOrder[])
    setCategories((categoriesResult.data || []) as MarketplaceCategory[])
    if (sellerProfileResult.data) setSellerProfile(sellerProfileResult.data as SellerProfile)
    if (user.role === 'seller' || user.role === 'admin') setSellerActivated(true)
    setAvatarUrl(user.avatarUrl || '')
    setDataLoading(false)
  }, [supabase, user])

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, router, user])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const statCards = useMemo(
    () => [
      { label: 'Available', value: formatCurrency(stats.available), detail: 'Ready to withdraw', icon: Wallet, tone: 'bg-[#ecfdf3] text-[#047857]' },
      { label: 'Pending', value: formatCurrency(stats.pending), detail: 'Awaiting acceptance', icon: CreditCard, tone: 'bg-[#fff8ea] text-[#8a5a18]' },
      { label: 'Active orders', value: stats.activeOrders.toString(), detail: 'Needs delivery or review', icon: CalendarCheck, tone: 'bg-[#eff8ff] text-[#175cd3]' },
      { label: 'Services', value: stats.services.toString(), detail: 'Drafts and live offers', icon: Briefcase, tone: 'bg-[#f4f3ff] text-[#5925dc]' },
    ],
    [stats]
  )

  const serviceStatusCounts = useMemo(() => {
    return services.reduce(
      (counts, service) => {
        const status = service.moderation_status || service.status || 'draft'
        if (status === 'active' && service.is_active) counts.live += 1
        else if (status === 'pending_review') counts.review += 1
        else if (status === 'rejected') counts.rejected += 1
        else counts.draft += 1
        return counts
      },
      { live: 0, review: 0, draft: 0, rejected: 0 }
    )
  }, [services])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const profileScore = () => {
    let score = 20
    if (sellerProfile.headline?.trim()) score += 25
    if (sellerProfile.location?.trim()) score += 15
    if (sellerProfile.response_time_minutes) score += 15
    if (avatarUrl) score += 10
    if (services.length) score += 15
    return Math.min(score, 100)
  }

  const uploadMedia = async (file: File, kind: 'profile' | 'service') => {
    if (!user) return
    if (kind === 'profile' && !file.type.startsWith('image/')) {
      toast.error('Upload an image file for your profile photo')
      return
    }
    if (kind === 'service' && !file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Upload an image or video file for your service')
      return
    }
    if (kind === 'profile' && file.size > 5 * 1024 * 1024) {
      toast.error('Profile photo must be 5MB or smaller')
      return
    }
    if (kind === 'service' && file.size > 25 * 1024 * 1024) {
      toast.error('Service media must be 25MB or smaller')
      return
    }

    setUploading(kind)
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'upload'
      const path = `${user.id}/${kind}-${Date.now()}.${extension}`
      const { error } = await supabase.storage.from('marketplace-media').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })
      if (error) throw error

      const { data } = supabase.storage.from('marketplace-media').getPublicUrl(path)
      const publicUrl = data.publicUrl

      if (kind === 'profile') {
        setAvatarUrl(publicUrl)
        await supabase.auth.updateUser({
          data: { avatar_url: publicUrl, picture: publicUrl },
        })
        await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id)
        await supabase.rpc('ensure_current_user_profile')
        toast.success('Profile media uploaded')
      } else {
        setServiceDraft((current) => ({ ...current, media_url: publicUrl }))
        toast.success('Listing media uploaded')
      }
    } catch (error: any) {
      toast.error(error.message || 'Upload failed. Check the marketplace-media storage bucket.')
    } finally {
      setUploading(null)
    }
  }

  const convertToSeller = async () => {
    if (!user) return
    setSaving(true)
    try {
      const token = await getAccessToken(supabase)
      const result = await activateSellerAccountAction(token, {
        headline: sellerProfile.headline,
        location: sellerProfile.location,
        responseTimeMinutes: sellerProfile.response_time_minutes,
        categorySpecializations: sellerProfile.category_specializations,
        portfolioUrls: sellerProfile.portfolio_urls,
        verificationNote: sellerProfile.verification_note,
      })
      const errorMessage = actionError(result)
      if (errorMessage) throw new Error(errorMessage)
      toast.success('Seller account activated')
      setSellerActivated(true)
      void loadData()
    } catch (error: any) {
      toast.error(error.message || 'Could not activate seller account')
    } finally {
      setSaving(false)
    }
  }

  const saveSellerProfile = async () => {
    if (!user) return
    setSaving(true)
    const nextProfile = { ...sellerProfile, profile_completion_score: profileScore() }
    try {
      const token = await getAccessToken(supabase)
      const result = await upsertSellerProfileAction(token, {
        headline: nextProfile.headline,
        location: nextProfile.location,
        responseTimeMinutes: nextProfile.response_time_minutes,
        isAcceptingOrders: nextProfile.is_accepting_orders,
        categorySpecializations: nextProfile.category_specializations,
        portfolioUrls: nextProfile.portfolio_urls,
        verificationNote: nextProfile.verification_note,
      })
      const errorMessage = actionError(result)
      if (errorMessage) throw new Error(errorMessage)
      setSellerProfile(nextProfile)
      toast.success('Seller profile saved')
      void loadData()
    } catch (error: any) {
      toast.error(error.message || 'Could not save seller profile')
    } finally {
      setSaving(false)
    }
  }

  const requestVerification = async () => {
    if (!user) return
    setSaving(true)
    try {
      const { error } = await supabase.rpc('request_seller_verification', {
        note: sellerProfile.verification_note || 'Profile submitted from seller dashboard.',
      })

      if (error) throw error
      setSellerProfile((current) => ({ ...current, verification_status: 'pending' }))
      toast.success('Verification request sent to moderation')
    } catch (error: any) {
      toast.error(error.message || 'Could not request verification')
    } finally {
      setSaving(false)
    }
  }

  const resetServiceDraft = () => {
    setEditingService(null)
    setServiceDraft({
      title: '',
      description: '',
      category: 'General',
      price: '100',
      delivery_days: '3',
      revision_count: '1',
      requirements: '',
      media_url: '',
      portfolio_urls: '',
      package_summary: '',
      cancellation_policy: defaultCancellationPolicy,
      tags: '',
    })
  }

  const editService = (service: SellerService) => {
    setEditingService(service)
    setServiceDraft({
      title: service.title,
      description: service.description || '',
      category: service.category || 'General',
      price: String(service.price || 0),
      delivery_days: String(service.delivery_days || 3),
      revision_count: String(service.revision_count || 1),
      requirements: service.requirements || '',
      media_url: service.media_url || '',
      portfolio_urls: (service.portfolio_urls || []).join(', '),
      package_summary: service.package_summary || '',
      cancellation_policy: service.cancellation_policy || defaultCancellationPolicy,
      tags: (service.tags || []).join(', '),
    })
  }

  const serviceQualityScore = () => {
    let score = 10
    if (serviceDraft.title.trim().length >= 12) score += 15
    if (serviceDraft.description.trim().length >= 160) score += 25
    if (serviceDraft.requirements.trim().length >= 40) score += 15
    if (serviceDraft.media_url.trim()) score += 15
    if (serviceDraft.portfolio_urls.split(',').map((item) => item.trim()).filter(Boolean).length) score += 15
    if (serviceDraft.tags.split(',').map((item) => item.trim()).filter(Boolean).length >= 3) score += 5
    return Math.min(score, 100)
  }

  const saveService = async (mode: 'draft' | 'review' = 'review') => {
    if (!user) return
    if (!serviceDraft.title.trim() || !serviceDraft.description.trim()) {
      toast.error('Add a title and description')
      return
    }

    setSaving(true)
    const payload = {
      seller_id: user.id,
      title: serviceDraft.title.trim(),
      description: serviceDraft.description.trim(),
      category: serviceDraft.category.trim() || 'General',
      category_slug: categories.find((category) => category.name === serviceDraft.category)?.slug || slugify(serviceDraft.category || 'General') || 'general',
      price: Math.max(1, Number(serviceDraft.price) || 1),
      delivery_days: Math.max(1, Number(serviceDraft.delivery_days) || 3),
      revision_count: Math.max(0, Number(serviceDraft.revision_count) || 0),
      requirements: serviceDraft.requirements.trim() || null,
      media_url: serviceDraft.media_url.trim() || null,
      portfolio_urls: commaList(serviceDraft.portfolio_urls),
      package_summary: serviceDraft.package_summary.trim() || null,
      cancellation_policy: serviceDraft.cancellation_policy.trim() || defaultCancellationPolicy,
      tags: commaList(serviceDraft.tags),
    }

    try {
      const token = await getAccessToken(supabase)
      const result = await upsertSellerServiceAction(token, {
        serviceId: editingService?.id || null,
        title: payload.title,
        description: payload.description,
        category: payload.category,
        categorySlug: payload.category_slug,
        price: payload.price,
        deliveryDays: payload.delivery_days,
        revisionCount: payload.revision_count,
        requirements: payload.requirements,
        mediaUrl: payload.media_url,
        portfolioUrls: payload.portfolio_urls,
        packageSummary: payload.package_summary,
        cancellationPolicy: payload.cancellation_policy,
        tags: payload.tags,
        submitForReview: mode === 'review',
      })
      const errorMessage = actionError(result)
      if (errorMessage) throw new Error(errorMessage)
      toast.success(mode === 'draft' ? 'Draft saved' : 'Service submitted for marketplace review')
      resetServiceDraft()
      void loadData()
    } catch (error: any) {
      toast.error(error.message || 'Could not save service')
    } finally {
      setSaving(false)
    }
  }

  const toggleService = async (service: SellerService) => {
    if (!user) return
    if (!['active', 'paused'].includes(service.moderation_status || '')) {
      toast.error('Only marketplace-approved services can be resumed or paused')
      return
    }

    const nextActive = !service.is_active
    setServices((current) =>
      current.map((item) =>
        item.id === service.id
          ? { ...item, is_active: nextActive, status: nextActive ? 'active' : 'paused', moderation_status: nextActive ? 'active' : 'paused' }
          : item
      )
    )

    try {
      const token = await getAccessToken(supabase)
      const result = await setSellerServiceVisibilityAction(token, service.id, nextActive)
      const errorMessage = actionError(result)
      if (errorMessage) throw new Error(errorMessage)
      toast.success(nextActive ? 'Service resumed' : 'Service paused')
    } catch (error: any) {
      toast.error(error.message || 'Could not update service')
      void loadData()
    }
  }

  if (loading || !user) {
    return (
      <div className='min-h-screen bg-white px-3 py-3'>
        <div className='mx-auto grid max-w-[1320px] gap-3 lg:grid-cols-[250px_1fr]'>
          <aside className='hidden min-h-[calc(100vh-96px)] rounded-lg bg-[#101828] p-5 lg:block'>
            <Skeleton className='mb-9 h-10 w-36 bg-white/15' />
            <div className='space-y-2'>
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className='h-10 w-full bg-white/10' />
              ))}
            </div>
          </aside>
          <main className='rounded-lg bg-white p-5 sm:p-8'>
            <div className='mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
              <div>
                <Skeleton className='h-9 w-72 max-w-full' />
                <Skeleton className='mt-3 h-4 w-96 max-w-full' />
              </div>
              <Skeleton className='h-10 w-28' />
            </div>
            <div className='mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className='h-28 w-full' />
              ))}
            </div>
            <div className='grid gap-5 xl:grid-cols-[0.9fr_1.1fr]'>
              <Skeleton className='h-96 w-full' />
              <Skeleton className='h-96 w-full' />
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#f8fafc] px-3 py-4 sm:px-6 sm:py-8 content-fade-in'>
      <div className='mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-[260px_1fr]'>
        <aside className='hidden min-h-[calc(100vh-112px)] rounded-lg bg-[#101828] p-5 text-white shadow-[0_18px_60px_rgba(16,24,40,0.18)] lg:sticky lg:top-24 lg:flex lg:flex-col'>
          <Link href='/' className='mb-9 flex items-center gap-3'>
            <div className='grid h-10 w-10 place-items-center rounded-lg bg-[#d8952f] font-serif text-lg font-bold text-[#101828]'>K</div>
            <div>
              <p className='text-sm font-extrabold tracking-[0.14em]'>KINGDOM</p>
              <p className='text-[10px] uppercase tracking-[0.18em] text-white/55'>Marketplace</p>
            </div>
          </Link>

          <nav className='space-y-1'>
            {menu.map(({ label, icon: Icon, active, href }) => (
              <Link
                key={label}
                href={href}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold transition ${
                  active ? 'bg-white/12 text-white' : 'text-white/68 hover:bg-white/8 hover:text-white'
                }`}
              >
                <span className='flex items-center gap-3'>
                  <Icon className='h-4 w-4' />
                  {label}
                </span>
              </Link>
            ))}
          </nav>

          <button onClick={signOut} className='mt-auto flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-white/68 hover:bg-white/8 hover:text-white'>
            <LogOut className='h-4 w-4' />
            Log out
          </button>
        </aside>

        <main id='seller-overview' className='min-w-0 space-y-6'>
          <section className='rounded-lg border border-[#d8c9b5] bg-white p-5 shadow-[0_18px_60px_rgba(33,24,10,0.08)] sm:p-7'>
            <div className='flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between'>
              <div className='min-w-0'>
                <p className='text-xs font-extrabold uppercase tracking-[0.18em] text-[#8a5a18]'>Seller studio</p>
                <h1 className='mt-2 text-3xl font-extrabold tracking-tight text-[#101828] sm:text-4xl'>Run your marketplace business</h1>
                <p className='mt-3 max-w-2xl text-sm leading-6 text-[#667085]'>Manage profile trust, services, review status, orders, and earnings from one operational workspace.</p>
              </div>
              <div className='flex flex-wrap gap-2'>
                <Button variant='outline' className='border-[#eadfce] bg-[#fffdf8]' onClick={() => loadData()}>
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Refresh
                </Button>
                <Link href='#seller-service-editor'>
                  <Button className='bg-[#101828] text-white hover:bg-[#1f2937]'>
                    <Plus className='mr-2 h-4 w-4' />
                    New service
                  </Button>
                </Link>
                <Link href={`/profile/${user.id}`}>
                  <Button variant='outline' className='border-[#eadfce] bg-white'>
                    <Eye className='mr-2 h-4 w-4' />
                    Public profile
                  </Button>
                </Link>
              </div>
            </div>

            <div className='mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
              {statCards.map(({ label, value, detail, icon: Icon, tone }) => (
                <div key={label} className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
                  <div className={`mb-4 grid h-9 w-9 place-items-center rounded-md ${tone}`}>
                    <Icon className='h-4 w-4' />
                  </div>
                  <p className='text-xs font-bold text-[#667085]'>{label}</p>
                  <p className='mt-1 text-2xl font-extrabold'>{dataLoading ? '...' : value}</p>
                  <p className='mt-1 text-xs text-[#667085]'>{detail}</p>
                </div>
              ))}
            </div>
          </section>

          <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]'>
            <section className='rounded-lg border border-[#d8c9b5] bg-white p-5 shadow-[0_14px_40px_rgba(33,24,10,0.06)] sm:p-6'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                <div>
                  <h2 className='text-xl font-extrabold'>Service pipeline</h2>
                  <p className='mt-1 text-sm leading-6 text-[#667085]'>Know exactly what is live, waiting for review, or still being drafted.</p>
                </div>
                <Link href='#seller-service-editor' className='text-sm font-bold text-[#8a5a18]'>Open editor</Link>
              </div>
              <div className='mt-5 grid gap-3 sm:grid-cols-4'>
                {[
                  ['Live', serviceStatusCounts.live, 'bg-[#ecfdf3] text-[#047857]'],
                  ['In review', serviceStatusCounts.review, 'bg-[#fff8ea] text-[#8a5a18]'],
                  ['Draft/paused', serviceStatusCounts.draft, 'bg-[#f8fafc] text-[#344054]'],
                  ['Needs fixes', serviceStatusCounts.rejected, 'bg-[#fff1f2] text-[#b42318]'],
                ].map(([label, count, tone]) => (
                  <div key={label} className={`rounded-lg px-4 py-3 ${tone}`}>
                    <p className='text-xs font-bold'>{label}</p>
                    <p className='mt-1 text-2xl font-extrabold'>{count}</p>
                  </div>
                ))}
              </div>
            </section>

            <aside className='rounded-lg border border-[#d8c9b5] bg-white p-5 shadow-[0_14px_40px_rgba(33,24,10,0.06)]'>
              <div className='flex items-center gap-2'>
                <ShieldCheck className='h-5 w-5 text-[#15803d]' />
                <h2 className='text-lg font-extrabold'>Trust readiness</h2>
              </div>
              <div className='mt-4'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='font-bold'>Profile completion</span>
                  <span className='font-extrabold'>{sellerProfile.profile_completion_score}%</span>
                </div>
                <div className='mt-2 h-2 overflow-hidden rounded-full bg-[#eadfce]'>
                  <div className='h-full bg-[#15803d]' style={{ width: `${sellerProfile.profile_completion_score}%` }} />
                </div>
                <p className='mt-2 text-xs leading-5 text-[#667085]'>Add a photo, headline, response time, and at least one service to improve buyer confidence.</p>
              </div>
              <div className='mt-4 rounded-md bg-[#fffdf8] px-3 py-2 text-sm'>
                <span className='font-bold'>Verification: </span>
                <span className='capitalize text-[#8a5a18]'>{statusLabel(sellerProfile.verification_status)}</span>
              </div>
            </aside>
          </div>

          {!sellerActivated && (
            <section className='rounded-lg border border-[#d8aa5e] bg-[#fff8ea] p-5'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <h2 className='font-extrabold'>Activate Seller Studio</h2>
                  <p className='mt-1 text-sm text-[#667085]'>Convert your account to seller mode, create a seller profile, and publish services.</p>
                </div>
                <Button className='bg-[#101828] text-white hover:bg-[#1f2937]' onClick={convertToSeller} disabled={saving}>
                  {saving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  Become a seller
                </Button>
              </div>
            </section>
          )}

          <section className='grid gap-5 xl:grid-cols-[0.9fr_1.1fr]'>
            <div id='seller-profile' className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
              <div className='mb-4 flex items-start justify-between gap-3'>
                <div>
                  <h2 className='font-extrabold'>Seller onboarding</h2>
                  <p className='mt-1 text-xs text-[#667085]'>Complete the details buyers use to judge fit and responsiveness.</p>
                </div>
                <span className='rounded-full bg-white px-2 py-1 text-[11px] font-bold capitalize text-[#8a5a18]'>
                  {sellerProfile.verification_status}
                </span>
              </div>
              <div className='space-y-4'>
                <div>
                  <Label>Profile media</Label>
                  <div className='mt-2 flex flex-col gap-3 rounded-lg bg-white p-3 sm:flex-row sm:items-center'>
                    <div className='relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-[#f2eadc] text-[#8a5a18]'>
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt='Profile media preview' fill sizes='80px' className='object-cover' />
                      ) : (
                        <Camera className='h-6 w-6' />
                      )}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-bold'>Upload a profile photo</p>
                      <p className='mt-1 text-xs leading-5 text-[#667085]'>This appears on listings and messages after your profile refreshes.</p>
                    </div>
                    <label className='inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-[#eadfce] bg-[#fffdf8] px-4 text-sm font-bold text-[#101828]'>
                      {uploading === 'profile' ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Upload className='mr-2 h-4 w-4' />}
                      Upload
                      <input
                        type='file'
                        accept='image/*'
                        className='sr-only'
                        disabled={uploading !== null}
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          if (file) void uploadMedia(file, 'profile')
                          event.target.value = ''
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <Label htmlFor='headline'>Headline</Label>
                  <Input
                    id='headline'
                    value={sellerProfile.headline || ''}
                    onChange={(event) => setSellerProfile((current) => ({ ...current, headline: event.target.value }))}
                    className='mt-2 bg-white'
                    placeholder='Brand designer for churches and creators'
                  />
                </div>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div>
                    <Label htmlFor='location'>Location</Label>
                    <Input
                      id='location'
                      value={sellerProfile.location || ''}
                      onChange={(event) => setSellerProfile((current) => ({ ...current, location: event.target.value }))}
                      className='mt-2 bg-white'
                    />
                  </div>
                  <div>
                    <Label htmlFor='response'>Response time</Label>
                    <select
                      id='response'
                      value={responseTimeOptions.some((option) => option.value === sellerProfile.response_time_minutes) ? String(sellerProfile.response_time_minutes) : 'custom'}
                      onChange={(event) => {
                        if (event.target.value === 'custom') return
                        setSellerProfile((current) => ({ ...current, response_time_minutes: Number(event.target.value) }))
                      }}
                      className='mt-2 h-10 w-full rounded-lg border border-[#eadfce] bg-white px-3 text-sm'
                    >
                      {responseTimeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                      <option value='custom'>Custom</option>
                    </select>
                    <div className='mt-2 flex items-center gap-2'>
                      <Input
                        type='number'
                        min='1'
                        value={sellerProfile.response_time_minutes || 1440}
                        onChange={(event) => setSellerProfile((current) => ({ ...current, response_time_minutes: Number(event.target.value) }))}
                        className='bg-white'
                      />
                      <span className='shrink-0 text-xs font-bold text-[#667085]'>
                        {formatResponseTime(sellerProfile.response_time_minutes)}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className='h-2 overflow-hidden rounded-full bg-[#eadfce]'>
                    <div className='h-full bg-[#15803d]' style={{ width: `${sellerProfile.profile_completion_score}%` }} />
                  </div>
                  <p className='mt-2 text-xs text-[#667085]'>{sellerProfile.profile_completion_score}% complete</p>
                </div>
                <Button className='w-full bg-[#101828] text-white hover:bg-[#1f2937]' onClick={saveSellerProfile} disabled={saving}>
                  {saving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  Save seller profile
                </Button>
                <Button
                  variant='outline'
                  className='w-full border-[#d8aa5e] bg-white text-[#8a5a18]'
                  onClick={requestVerification}
                  disabled={saving || sellerProfile.verification_status === 'pending' || sellerProfile.verification_status === 'verified'}
                >
                  {sellerProfile.verification_status === 'verified'
                    ? 'Seller verified'
                    : sellerProfile.verification_status === 'pending'
                      ? 'Verification pending'
                      : 'Request seller verification'}
                </Button>
              </div>
            </div>

            <div id='seller-service-editor' className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
              <div className='mb-4 flex items-center justify-between gap-3'>
                <div>
                  <h2 className='font-extrabold'>{editingService ? 'Edit service' : 'Create service'}</h2>
                  <p className='mt-1 text-xs text-[#667085]'>Draft a scoped offer, then submit it for review before it goes live.</p>
                </div>
                {editingService && (
                  <Button variant='outline' size='sm' className='border-[#eadfce] bg-white' onClick={resetServiceDraft}>
                    Cancel
                  </Button>
                )}
              </div>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='sm:col-span-2'>
                  <Label htmlFor='serviceTitle'>Title</Label>
                  <Input id='serviceTitle' value={serviceDraft.title} onChange={(event) => setServiceDraft((current) => ({ ...current, title: event.target.value }))} className='mt-2 bg-white' />
                </div>
                <div className='sm:col-span-2'>
                  <Label htmlFor='serviceDescription'>Description</Label>
                  <Textarea id='serviceDescription' value={serviceDraft.description} onChange={(event) => setServiceDraft((current) => ({ ...current, description: event.target.value }))} className='mt-2 min-h-24 bg-white' />
                </div>
                <div>
                  <Label htmlFor='serviceCategory'>Category</Label>
                  <select
                    id='serviceCategory'
                    value={serviceDraft.category}
                    onChange={(event) => setServiceDraft((current) => ({ ...current, category: event.target.value }))}
                    className='mt-2 h-10 w-full rounded-lg border border-[#eadfce] bg-white px-3 text-sm'
                  >
                    {(categories.length ? categories : [{ name: 'General', slug: 'general' }]).map((category) => (
                      <option key={category.slug} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor='servicePrice'>Price</Label>
                  <Input id='servicePrice' type='number' min='1' value={serviceDraft.price} onChange={(event) => setServiceDraft((current) => ({ ...current, price: event.target.value }))} className='mt-2 bg-white' />
                </div>
                <div>
                  <Label htmlFor='deliveryDays'>Delivery days</Label>
                  <Input id='deliveryDays' type='number' min='1' value={serviceDraft.delivery_days} onChange={(event) => setServiceDraft((current) => ({ ...current, delivery_days: event.target.value }))} className='mt-2 bg-white' />
                </div>
                <div>
                  <Label htmlFor='revisionCount'>Revisions</Label>
                  <Input id='revisionCount' type='number' min='0' value={serviceDraft.revision_count} onChange={(event) => setServiceDraft((current) => ({ ...current, revision_count: event.target.value }))} className='mt-2 bg-white' />
                </div>
                <div className='sm:col-span-2'>
                  <Label>Listing media</Label>
                  <div className='mt-2 rounded-lg bg-white p-3'>
                    {serviceDraft.media_url ? (
                      <div className='mb-3 overflow-hidden rounded-lg border border-[#eadfce] bg-[#f2eadc]'>
                        {isVideoMedia(serviceDraft.media_url) ? (
                          <video src={serviceDraft.media_url} controls className='aspect-video w-full object-cover' />
                        ) : (
                          <div className='relative aspect-video'>
                            <Image src={serviceDraft.media_url} alt='Listing media preview' fill sizes='(min-width: 768px) 520px, 100vw' className='object-cover' />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className='mb-3 grid min-h-32 place-items-center rounded-lg border border-dashed border-[#d8c9b5] bg-[#fffdf8] text-center text-sm text-[#667085]'>
                        Add a service image or short video.
                      </div>
                    )}
                    <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                      <p className='text-xs leading-5 text-[#667085]'>Upload replaces manual media URLs and gives buyers a clearer preview.</p>
                      <label className='inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-[#eadfce] bg-[#fffdf8] px-4 text-sm font-bold text-[#101828]'>
                        {uploading === 'service' ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Upload className='mr-2 h-4 w-4' />}
                        Upload media
                        <input
                          type='file'
                          accept='image/*,video/*'
                          className='sr-only'
                          disabled={uploading !== null}
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (file) void uploadMedia(file, 'service')
                            event.target.value = ''
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <div className='sm:col-span-2'>
                  <Label htmlFor='packageSummary'>Package summary</Label>
                  <Textarea id='packageSummary' value={serviceDraft.package_summary} onChange={(event) => setServiceDraft((current) => ({ ...current, package_summary: event.target.value }))} className='mt-2 min-h-20 bg-white' />
                </div>
                <div className='sm:col-span-2'>
                  <Label htmlFor='serviceTags'>Tags</Label>
                  <Input id='serviceTags' value={serviceDraft.tags} onChange={(event) => setServiceDraft((current) => ({ ...current, tags: event.target.value }))} placeholder='logo, church, launch' className='mt-2 bg-white' />
                </div>
                <div className='sm:col-span-2'>
                  <Label htmlFor='requirements'>Buyer requirements</Label>
                  <Textarea id='requirements' value={serviceDraft.requirements} onChange={(event) => setServiceDraft((current) => ({ ...current, requirements: event.target.value }))} className='mt-2 min-h-20 bg-white' />
                </div>
              </div>
              <div className='mt-4 rounded-lg bg-white p-3'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='font-bold'>Listing quality</span>
                  <span className='font-extrabold'>{serviceQualityScore()}%</span>
                </div>
                <div className='mt-2 h-2 overflow-hidden rounded-full bg-[#eadfce]'>
                  <div className='h-full bg-[#15803d]' style={{ width: `${serviceQualityScore()}%` }} />
                </div>
              </div>
              <div className='mt-4 grid gap-2 sm:grid-cols-2'>
                <Button variant='outline' className='border-[#eadfce] bg-white' onClick={() => saveService('draft')} disabled={saving}>
                  {saving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  Save draft
                </Button>
                <Button className='bg-[#101828] text-white hover:bg-[#1f2937]' onClick={() => saveService('review')} disabled={saving}>
                  {saving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  Submit for review
                </Button>
              </div>
            </div>
          </section>

          <div className='grid gap-5 xl:grid-cols-[1fr_0.9fr]'>
            <section id='seller-orders' className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
              <div className='mb-5 flex items-center justify-between'>
                <div>
                  <h2 className='font-extrabold'>Recent Orders</h2>
                  <p className='mt-1 text-xs text-[#667085]'>Only real orders assigned to this seller appear here.</p>
                </div>
                <Link href='/dashboard/payments' className='text-xs font-bold text-[#8a5a18]'>View all</Link>
              </div>
              <div className='space-y-3'>
                {orders.map((order) => (
                  <div key={order.id} className='flex items-center gap-3 rounded-lg bg-white p-3'>
                    <div className='grid h-11 w-11 place-items-center rounded-lg bg-[#f2eadc] text-[#8a5a18]'>
                      <CalendarCheck className='h-5 w-5' />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-bold'>{order.title}</p>
                      <p className='text-[11px] uppercase tracking-wide text-[#98a2b3]'>{formatTimeAgo(order.created_at)}</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm font-extrabold'>{formatCurrency(order.amount)}</p>
                      <p className='text-xs font-bold text-[#b97822]'>{order.order_status}</p>
                    </div>
                  </div>
                ))}
                {!orders.length && (
                  <div className='rounded-lg border border-dashed border-[#d8c9b5] bg-white p-8 text-center text-sm text-[#667085]'>
                    No seller orders yet.
                  </div>
                )}
              </div>
            </section>

            <section id='seller-services' className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
              <div className='mb-5 flex items-center justify-between'>
                <h2 className='font-extrabold'>Services</h2>
                <Button size='sm' variant='outline' className='border-[#eadfce] bg-white' onClick={resetServiceDraft}>
                  <Plus className='mr-2 h-4 w-4' />
                  New
                </Button>
              </div>
              <div className='space-y-3'>
                {services.map((service) => (
                  <div key={service.id} className='rounded-lg bg-white p-4'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-bold'>{service.title}</p>
                        <p className='mt-1 text-xs text-[#667085]'>
                          {formatCurrency(service.price)} - {service.category || 'General'} - {service.delivery_days || 3}d
                        </p>
                      </div>
                      <span className='rounded-full bg-[#f2eadc] px-2 py-1 text-[10px] font-bold text-[#8a5a18]'>
                        {service.moderation_status || service.status}
                      </span>
                    </div>
                    <div className='mt-3 h-2 overflow-hidden rounded-full bg-[#eadfce]'>
                      <div className='h-full bg-[#15803d]' style={{ width: `${service.quality_score || 0}%` }} />
                    </div>
                    <div className='mt-4 flex flex-wrap gap-2'>
                      <Button size='sm' variant='outline' className='border-[#eadfce] bg-[#fffdf8]' onClick={() => editService(service)}>
                        Edit
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        className='border-[#eadfce] bg-[#fffdf8]'
                        onClick={() => toggleService(service)}
                        disabled={!['active', 'paused'].includes(service.moderation_status || '')}
                      >
                        {service.moderation_status === 'active' || service.moderation_status === 'paused'
                          ? service.is_active
                            ? 'Pause'
                            : 'Resume'
                          : 'Awaiting review'}
                      </Button>
                      <Link href={`/listing/${service.slug || service.id}`}>
                        <Button size='sm' variant='outline' className='border-[#eadfce] bg-[#fffdf8]'>
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {!services.length && (
                  <div className='rounded-lg border border-dashed border-[#d8c9b5] bg-white p-8 text-center'>
                    <Briefcase className='mx-auto h-8 w-8 text-[#b97822]' />
                    <p className='mt-3 text-sm font-bold'>Create your first service</p>
                    <p className='mt-1 text-xs leading-5 text-[#667085]'>Publish a service to start receiving marketplace inquiries and orders.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
