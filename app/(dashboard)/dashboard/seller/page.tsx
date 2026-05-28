'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Briefcase,
  CalendarCheck,
  CreditCard,
  Home,
  Loader2,
  LogOut,
  MessageCircle,
  Plus,
  RefreshCw,
  User,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCurrentUser } from '@/hooks/use-current-user'
import { formatCurrency, formatTimeAgo, slugify } from '@/lib/utils'

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

const menu = [
  { label: 'Dashboard', icon: Home, active: true, href: '#seller-overview' },
  { label: 'Services', icon: Briefcase, href: '#seller-services' },
  { label: 'Orders', icon: CalendarCheck, href: '/dashboard/payments' },
  { label: 'Messages', icon: MessageCircle, href: '/dashboard/messages' },
  { label: 'Earnings', icon: CreditCard, href: '/dashboard/payments' },
  { label: 'Profile', icon: User, href: '#seller-profile' },
]

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
    cancellation_policy: 'Buyer may request cancellation before work begins. Active orders require seller/admin review.',
    tags: '',
  })
  const [dataLoading, setDataLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sellerActivated, setSellerActivated] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return
    setDataLoading(true)

    const [walletResult, activeOrdersResult, completedOrdersResult, servicesResult, recentOrdersResult, sellerProfileResult] =
      await Promise.all([
        supabase.from('wallets').select('available_balance, pending_balance').eq('user_id', user.id).maybeSingle(),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('seller_id', user.id).in('order_status', ['ACTIVE', 'DELIVERED', 'REVISION_REQUESTED']),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('seller_id', user.id).eq('order_status', 'COMPLETED'),
        supabase.from('services').select('id, title, slug, description, category, category_slug, price, delivery_days, revision_count, requirements, media_url, portfolio_urls, package_summary, cancellation_policy, quality_score, moderation_status, tags, status, is_active').eq('seller_id', user.id).order('created_at', { ascending: false }).limit(12),
        supabase.from('orders').select('id, title, amount, order_status, created_at').eq('seller_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('seller_profiles').select('headline, location, response_time_minutes, verification_status, profile_completion_score, is_accepting_orders, category_specializations, portfolio_urls, verification_note').eq('user_id', user.id).maybeSingle(),
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
    if (sellerProfileResult.data) setSellerProfile(sellerProfileResult.data as SellerProfile)
    if (user.role === 'seller' || user.role === 'admin') setSellerActivated(true)
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
      ['Available Earnings', formatCurrency(stats.available), 'Ready to withdraw'],
      ['Pending Beta Balance', formatCurrency(stats.pending), 'Awaiting delivery acceptance'],
      ['Active Orders', stats.activeOrders.toString(), 'Needs delivery or review'],
      ['Published Services', stats.services.toString(), 'Visible marketplace offers'],
    ],
    [stats]
  )

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const profileScore = () => {
    let score = 20
    if (sellerProfile.headline?.trim()) score += 25
    if (sellerProfile.location?.trim()) score += 15
    if (sellerProfile.response_time_minutes) score += 15
    if (sellerProfile.category_specializations.length) score += 10
    if (sellerProfile.portfolio_urls.length) score += 10
    if (services.length) score += 15
    return Math.min(score, 100)
  }

  const convertToSeller = async () => {
    if (!user) return
    setSaving(true)
    const [userResult, profileResult, sellerResult] = await Promise.all([
      supabase.from('users').update({ role: 'seller' }).eq('id', user.id),
      supabase.from('profiles').upsert({ user_id: user.id, is_seller: true }, { onConflict: 'user_id' }),
      supabase.from('seller_profiles').upsert(
        {
          user_id: user.id,
          ...sellerProfile,
          profile_completion_score: profileScore(),
        },
        { onConflict: 'user_id' }
      ),
    ])
    setSaving(false)

    if (userResult.error || profileResult.error || sellerResult.error) {
      toast.error(userResult.error?.message || profileResult.error?.message || sellerResult.error?.message || 'Could not convert account')
      return
    }

    toast.success('Seller account activated')
    setSellerActivated(true)
    void loadData()
  }

  const saveSellerProfile = async () => {
    if (!user) return
    setSaving(true)
    const nextProfile = { ...sellerProfile, profile_completion_score: profileScore() }
    const { error } = await supabase.from('seller_profiles').upsert(
      {
        user_id: user.id,
        ...nextProfile,
      },
      { onConflict: 'user_id' }
    )
    setSaving(false)

    if (error) {
      toast.error(error.message || 'Could not save seller profile')
      return
    }

    setSellerProfile(nextProfile)
    toast.success('Seller profile saved')
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
      cancellation_policy: 'Buyer may request cancellation before work begins. Active orders require seller/admin review.',
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
      cancellation_policy: service.cancellation_policy || 'Buyer may request cancellation before work begins. Active orders require seller/admin review.',
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
      category_slug: slugify(serviceDraft.category || 'General') || 'general',
      price: Math.max(1, Number(serviceDraft.price) || 1),
      delivery_days: Math.max(1, Number(serviceDraft.delivery_days) || 3),
      revision_count: Math.max(0, Number(serviceDraft.revision_count) || 0),
      requirements: serviceDraft.requirements.trim() || null,
      media_url: serviceDraft.media_url.trim() || null,
      portfolio_urls: serviceDraft.portfolio_urls.split(',').map((url) => url.trim()).filter(Boolean),
      package_summary: serviceDraft.package_summary.trim() || null,
      cancellation_policy: serviceDraft.cancellation_policy.trim() || 'Buyer may request cancellation before work begins. Active orders require seller/admin review.',
      tags: serviceDraft.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      quality_score: serviceQualityScore(),
      moderation_status: mode === 'draft' ? 'draft' as const : 'pending_review' as const,
      status: mode === 'draft' ? 'draft' as const : 'paused' as const,
      is_active: false,
    }

    const result = editingService
      ? await supabase.from('services').update(payload).eq('id', editingService.id).eq('seller_id', user.id)
      : await supabase.from('services').insert(payload)

    setSaving(false)

    if (result.error) {
      toast.error(result.error.message || 'Could not save service')
      return
    }

    toast.success(mode === 'draft' ? 'Draft saved' : 'Service submitted for review')
    resetServiceDraft()
    void loadData()
  }

  const toggleService = async (service: SellerService) => {
    if (!user) return
    const nextActive = !service.is_active
    setServices((current) =>
      current.map((item) =>
        item.id === service.id
          ? { ...item, is_active: nextActive, status: nextActive ? 'active' : 'paused', moderation_status: nextActive ? 'active' : 'paused' }
          : item
      )
    )

    const { error } = await supabase
      .from('services')
      .update({ is_active: nextActive, status: nextActive ? 'active' : 'paused', moderation_status: nextActive ? 'active' : 'paused' })
      .eq('id', service.id)
      .eq('seller_id', user.id)

    if (error) {
      toast.error('Could not update service')
      void loadData()
    }
  }

  if (loading || !user) {
    return (
      <div className='grid min-h-screen place-items-center'>
        <Loader2 className='h-8 w-8 animate-spin text-[#b97822]' />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#f7f3ec] px-3 py-3 content-fade-in'>
      <div className='mx-auto grid max-w-[1320px] gap-3 lg:grid-cols-[250px_1fr]'>
        <aside className='hidden min-h-[calc(100vh-96px)] rounded-lg bg-[#101828] p-5 text-white lg:flex lg:flex-col'>
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

        <main id='seller-overview' className='rounded-lg bg-white p-5 shadow-[0_18px_60px_rgba(33,24,10,0.08)] sm:p-8'>
          <div className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div>
              <h1 className='text-3xl font-extrabold tracking-tight'>Seller dashboard</h1>
              <p className='mt-1 text-sm text-[#667085]'>Operate your services, orders, messages, and earnings from live marketplace data.</p>
            </div>
            <div className='flex items-center gap-2'>
              <Button variant='outline' className='border-[#eadfce] bg-[#fffdf8]' onClick={() => loadData()}>
                <RefreshCw className='mr-2 h-4 w-4' />
                Refresh
              </Button>
            </div>
          </div>

          {!sellerActivated && (
            <section className='mb-6 rounded-lg border border-[#d8aa5e] bg-[#fff8ea] p-5'>
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

          <div className='mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            {statCards.map(([label, value, detail]) => (
              <div key={label} className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5 transition hover:bg-white hover:shadow-sm'>
                <p className='text-xs font-medium text-[#667085]'>{label}</p>
                <p className='mt-3 text-3xl font-extrabold'>{dataLoading ? '...' : value}</p>
                <p className='mt-2 text-xs font-semibold text-[#15803d]'>{detail}</p>
              </div>
            ))}
          </div>

          <section className='mb-6 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]'>
            <div id='seller-profile' className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
              <div className='mb-4 flex items-start justify-between gap-3'>
                <div>
                  <h2 className='font-extrabold'>Seller onboarding</h2>
                  <p className='mt-1 text-xs text-[#667085]'>Profile data saves to seller_profiles.</p>
                </div>
                <span className='rounded-full bg-white px-2 py-1 text-[11px] font-bold capitalize text-[#8a5a18]'>
                  {sellerProfile.verification_status}
                </span>
              </div>
              <div className='space-y-4'>
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
                    <Label htmlFor='response'>Response time minutes</Label>
                    <Input
                      id='response'
                      type='number'
                      min='1'
                      value={sellerProfile.response_time_minutes || 1440}
                      onChange={(event) => setSellerProfile((current) => ({ ...current, response_time_minutes: Number(event.target.value) }))}
                      className='mt-2 bg-white'
                    />
                  </div>
                </div>
                <label className='flex items-center justify-between gap-3 rounded-lg bg-white p-3 text-sm font-bold'>
                  Accepting orders
                  <input
                    type='checkbox'
                    checked={sellerProfile.is_accepting_orders}
                    onChange={(event) => setSellerProfile((current) => ({ ...current, is_accepting_orders: event.target.checked }))}
                    className='h-4 w-4'
                  />
                </label>
                <div>
                  <Label htmlFor='specializations'>Category specializations</Label>
                  <Input
                    id='specializations'
                    value={sellerProfile.category_specializations.join(', ')}
                    onChange={(event) =>
                      setSellerProfile((current) => ({
                        ...current,
                        category_specializations: event.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                      }))
                    }
                    className='mt-2 bg-white'
                    placeholder='branding, video, worship, web'
                  />
                </div>
                <div>
                  <Label htmlFor='portfolioUrls'>Portfolio links</Label>
                  <Input
                    id='portfolioUrls'
                    value={sellerProfile.portfolio_urls.join(', ')}
                    onChange={(event) =>
                      setSellerProfile((current) => ({
                        ...current,
                        portfolio_urls: event.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                      }))
                    }
                    className='mt-2 bg-white'
                    placeholder='https://portfolio.example, https://case-study.example'
                  />
                </div>
                <div>
                  <Label htmlFor='verificationNote'>Verification note</Label>
                  <Textarea
                    id='verificationNote'
                    value={sellerProfile.verification_note || ''}
                    onChange={(event) => setSellerProfile((current) => ({ ...current, verification_note: event.target.value }))}
                    className='mt-2 min-h-20 bg-white'
                    placeholder='Share ministry/business identity details, portfolio context, or approval notes.'
                  />
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
              </div>
            </div>

            <div id='seller-service-editor' className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
              <div className='mb-4 flex items-center justify-between gap-3'>
                <div>
                  <h2 className='font-extrabold'>{editingService ? 'Edit service' : 'Create service'}</h2>
                  <p className='mt-1 text-xs text-[#667085]'>Services appear in marketplace search after publishing.</p>
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
                  <Input id='serviceCategory' value={serviceDraft.category} onChange={(event) => setServiceDraft((current) => ({ ...current, category: event.target.value }))} className='mt-2 bg-white' />
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
                  <Label htmlFor='mediaUrl'>Media URL</Label>
                  <Input id='mediaUrl' value={serviceDraft.media_url} onChange={(event) => setServiceDraft((current) => ({ ...current, media_url: event.target.value }))} className='mt-2 bg-white' />
                </div>
                <div className='sm:col-span-2'>
                  <Label htmlFor='portfolioServiceUrls'>Portfolio URLs</Label>
                  <Input id='portfolioServiceUrls' value={serviceDraft.portfolio_urls} onChange={(event) => setServiceDraft((current) => ({ ...current, portfolio_urls: event.target.value }))} placeholder='https://proof.example, https://case-study.example' className='mt-2 bg-white' />
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
                <div className='sm:col-span-2'>
                  <Label htmlFor='cancellationPolicy'>Cancellation policy</Label>
                  <Textarea id='cancellationPolicy' value={serviceDraft.cancellation_policy} onChange={(event) => setServiceDraft((current) => ({ ...current, cancellation_policy: event.target.value }))} className='mt-2 min-h-20 bg-white' />
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
                      <Button size='sm' variant='outline' className='border-[#eadfce] bg-[#fffdf8]' onClick={() => toggleService(service)}>
                        {service.is_active ? 'Pause' : 'Publish'}
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
