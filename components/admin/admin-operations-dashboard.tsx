'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Check, CreditCard, Flag, Loader2, RefreshCw, ShieldCheck, SlidersHorizontal, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase-client'
import { formatCurrency, formatTimeAgo, slugify } from '@/lib/utils'
import { Database } from '@/types/database'

type UserRow = Database['public']['Tables']['users']['Row'] & {
  seller_profile?:
    | Pick<Database['public']['Tables']['seller_profiles']['Row'], 'verification_status' | 'profile_completion_score' | 'headline'>[]
    | Pick<Database['public']['Tables']['seller_profiles']['Row'], 'verification_status' | 'profile_completion_score' | 'headline'>
    | null
}
type ServiceRow = Pick<
  Database['public']['Tables']['services']['Row'],
  | 'id'
  | 'title'
  | 'seller_id'
  | 'category'
  | 'description'
  | 'price'
  | 'delivery_days'
  | 'media_url'
  | 'moderation_status'
  | 'is_active'
  | 'quality_score'
  | 'created_at'
  | 'takedown_reason'
> & { seller?: { full_name: string | null; email: string | null } | null }
type ReviewRow = Database['public']['Tables']['reviews']['Row'] & {
  buyer?: { full_name: string | null } | null
  seller?: { full_name: string | null } | null
}
type ReportRow = Database['public']['Tables']['abuse_reports']['Row'] & {
  reporter?: { full_name: string | null; email: string | null } | null
}
type OrderRow = Database['public']['Tables']['orders']['Row'] & {
  buyer?: { full_name: string | null } | null
  seller?: { full_name: string | null } | null
}
type OrderDocumentRow = Database['public']['Tables']['order_documents']['Row'] & {
  order?: { title: string | null } | null
  uploader?: { full_name: string | null; email: string | null } | null
}
type CategoryRow = Database['public']['Tables']['categories']['Row']
type AuditRow = Database['public']['Tables']['admin_audit_logs']['Row']
type AdjustmentRow = Database['public']['Tables']['manual_adjustments']['Row']

const tabs = ['Overview', 'Users', 'Services', 'Orders', 'Documents', 'Reviews', 'Reports', 'Disputes', 'Categories', 'Audit'] as const

function first<T>(value: T[] | T | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] || null : value
}

function badgeClass(status: string) {
  if (['active', 'verified', 'published', 'resolved', 'COMPLETED'].includes(status)) return 'bg-[#dcfce7] text-[#166534]'
  if (['pending', 'pending_review', 'reviewing', 'DISPUTED', 'flagged'].includes(status)) return 'bg-[#fef3c7] text-[#92400e]'
  if (['banned', 'rejected', 'archived', 'hidden', 'dismissed', 'CANCELLED'].includes(status)) return 'bg-[#fee2e2] text-[#991b1b]'
  return 'bg-[#e5e7eb] text-[#374151]'
}

export default function AdminOperationsDashboard() {
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [tab, setTab] = useState<(typeof tabs)[number]>('Overview')
  const [busy, setBusy] = useState<string | null>(null)
  const [users, setUsers] = useState<UserRow[]>([])
  const [services, setServices] = useState<ServiceRow[]>([])
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [reports, setReports] = useState<ReportRow[]>([])
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [documents, setDocuments] = useState<OrderDocumentRow[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [audits, setAudits] = useState<AuditRow[]>([])
  const [adjustments, setAdjustments] = useState<AdjustmentRow[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({})
  const [categoryDraft, setCategoryDraft] = useState({ name: '', slug: '', description: '', icon: '', active: true })
  const [adjustmentDraft, setAdjustmentDraft] = useState({ userId: '', orderId: '', type: 'refund_placeholder', amount: '0', reason: '' })

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }
    setCurrentUserId(user.id)

    const { data: profile, error: profileError } = await supabase.from('users').select('role, email').eq('id', user.id).maybeSingle()
    if (profileError) {
      setLoadError(profileError.message)
    }

    const admin = ['admin', 'moderator'].includes(profile?.role || '')
    setIsAdmin(admin)
    if (!admin) {
      setLoading(false)
      return
    }

    const [usersResult, servicesResult, documentsResult, reviewsResult, reportsResult, ordersResult, categoriesResult, auditsResult, adjustmentsResult] =
      await Promise.all([
        supabase
          .from('users')
          .select('*, seller_profile:seller_profiles!seller_profiles_user_id_fkey(verification_status, profile_completion_score, headline)')
          .order('created_at', { ascending: false })
          .limit(60),
        supabase
          .from('services')
          .select('id, title, seller_id, category, description, price, delivery_days, media_url, moderation_status, is_active, quality_score, created_at, takedown_reason, seller:users!services_seller_id_fkey(full_name, email)')
          .order('created_at', { ascending: false })
          .limit(80),
        supabase
          .from('order_documents')
          .select('*, order:orders(title), uploader:users!order_documents_uploaded_by_fkey(full_name, email)')
          .order('created_at', { ascending: false })
          .limit(80),
        supabase
          .from('reviews')
          .select('*, buyer:users!reviews_buyer_id_fkey(full_name), seller:users!reviews_seller_id_fkey(full_name)')
          .order('created_at', { ascending: false })
          .limit(60),
        supabase
          .from('abuse_reports')
          .select('*, reporter:users!abuse_reports_reporter_id_fkey(full_name, email)')
          .order('created_at', { ascending: false })
          .limit(80),
        supabase
          .from('orders')
          .select('*, buyer:users!orders_buyer_id_fkey(full_name), seller:users!orders_seller_id_fkey(full_name)')
          .order('created_at', { ascending: false })
          .limit(60),
        supabase.from('categories').select('*').order('sort_order', { ascending: true }).order('name'),
        supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(80),
        supabase.from('manual_adjustments').select('*').order('created_at', { ascending: false }).limit(40),
      ])

    setUsers((usersResult.data || []) as unknown as UserRow[])
    setServices((servicesResult.data || []) as unknown as ServiceRow[])
    setDocuments((documentsResult.data || []) as unknown as OrderDocumentRow[])
    setReviews((reviewsResult.data || []) as unknown as ReviewRow[])
    setReports((reportsResult.data || []) as unknown as ReportRow[])
    setOrders((ordersResult.data || []) as unknown as OrderRow[])
    setCategories((categoriesResult.data || []) as CategoryRow[])
    setAudits((auditsResult.data || []) as AuditRow[])
    setAdjustments((adjustmentsResult.data || []) as AdjustmentRow[])
    const firstError = [
      usersResult.error,
      servicesResult.error,
      documentsResult.error,
      reviewsResult.error,
      reportsResult.error,
      ordersResult.error,
      categoriesResult.error,
      auditsResult.error,
      adjustmentsResult.error,
    ].find(Boolean)
    if (firstError) {
      setLoadError(firstError.message)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const runAction = async (key: string, action: () => Promise<unknown>) => {
    setBusy(key)
    try {
      await action()
      await loadData()
      toast.success('Admin operation completed')
    } catch (error: any) {
      toast.error(error.message || 'Admin operation failed')
    } finally {
      setBusy(null)
    }
  }

  const decisionNote = (key: string, fallback: string) => {
    const note = decisionNotes[key]?.trim()
    return note || fallback
  }

  const DecisionNote = ({ noteKey, placeholder }: { noteKey: string; placeholder: string }) => (
    <Textarea
      className='mb-2 min-h-[68px] w-full border-[#eadfce] bg-[#fffdf8] text-xs'
      placeholder={placeholder}
      value={decisionNotes[noteKey] || ''}
      onChange={(event) => setDecisionNotes((current) => ({ ...current, [noteKey]: event.target.value }))}
    />
  )

  const upsertCategory = () =>
    runAction('category', async () => {
      const name = categoryDraft.name.trim()
      if (!name) throw new Error('Category name is required')
      const { error } = await supabase.rpc('admin_upsert_category', {
        target_name: name,
        target_slug: categoryDraft.slug.trim() || slugify(name),
        target_description: categoryDraft.description || null,
        target_icon: categoryDraft.icon || null,
        target_is_active: categoryDraft.active,
      })
      if (error) throw error
      setCategoryDraft({ name: '', slug: '', description: '', icon: '', active: true })
    })

  const recordAdjustment = () =>
    runAction('adjustment', async () => {
      if (!adjustmentDraft.userId.trim()) throw new Error('User ID is required')
      if (!adjustmentDraft.reason.trim()) throw new Error('Adjustment reason is required')
      const { error } = await supabase.rpc('admin_record_manual_adjustment', {
        target_user_id: adjustmentDraft.userId.trim(),
        target_order_id: adjustmentDraft.orderId.trim() || null,
        adjustment_kind: adjustmentDraft.type,
        adjustment_amount: Number(adjustmentDraft.amount || 0),
        adjustment_reason: adjustmentDraft.reason.trim(),
      })
      if (error) throw error
      setAdjustmentDraft({ userId: '', orderId: '', type: 'refund_placeholder', amount: '0', reason: '' })
    })

  const pendingServices = services.filter((item) => item.moderation_status === 'pending_review')
  const pendingDocuments = documents.filter((item) => item.review_status === 'pending_review')
  const pendingSellers = users.filter((item) => first(item.seller_profile)?.verification_status === 'pending')
  const openReports = reports.filter((item) => ['open', 'reviewing'].includes(item.status))
  const pendingPaymentOrders = orders.filter((item) => item.order_status === 'PENDING_PAYMENT')
  const disputes = orders.filter((item) => item.order_status === 'DISPUTED')

  if (loading) {
    return (
      <div className='grid min-h-[70vh] place-items-center'>
        <Loader2 className='h-8 w-8 animate-spin text-[#b97822]' />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className='grid min-h-[70vh] place-items-center px-4 text-center'>
        <div>
          <ShieldCheck className='mx-auto h-10 w-10 text-[#b97822]' />
          <h1 className='mt-4 text-2xl font-extrabold'>Admin access required</h1>
          <p className='mt-2 text-sm text-[#667085]'>Trust operations are restricted to admin users.</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-white px-3 py-5 sm:px-5'>
      <div className='mx-auto max-w-[1500px]'>
        <div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h1 className='text-3xl font-extrabold'>Admin Operations</h1>
            <p className='mt-1 text-sm text-[#667085]'>Moderation, verification, reports, disputes, categories, and beta finance placeholders.</p>
          </div>
          <Button variant='outline' className='border-[#eadfce] bg-white' onClick={() => loadData()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
        </div>

        {loadError && (
          <div className='mb-5 rounded-lg border border-[#fecaca] bg-[#fff1f2] p-4 text-sm leading-6 text-[#991b1b]'>
            Admin data loaded with a schema warning: {loadError}. Apply the latest Supabase migrations if this persists.
          </div>
        )}

        <div className='mb-5 flex gap-2 overflow-x-auto pb-1'>
          {tabs.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`shrink-0 rounded-lg px-4 py-2 text-xs font-extrabold ${tab === item ? 'bg-[#101828] text-white' : 'bg-white text-[#667085]'}`}
            >
              {item}
            </button>
          ))}
        </div>

        {tab === 'Overview' && (
          <div className='grid gap-4'>
            <div className='grid gap-4 md:grid-cols-4'>
              {[
                ['Pending sellers', pendingSellers.length],
                ['Pending services', pendingServices.length],
                ['Awaiting payment', pendingPaymentOrders.length],
                ['Documents', pendingDocuments.length],
                ['Open reports', openReports.length],
                ['Disputes', disputes.length],
              ].map(([label, value]) => (
                <div key={label} className='rounded-lg border border-[#eadfce] bg-white p-5'>
                  <p className='text-sm font-bold text-[#667085]'>{label}</p>
                  <p className='mt-3 text-3xl font-extrabold'>{value}</p>
                </div>
              ))}
            </div>
            <div className='rounded-lg border border-[#eadfce] bg-white p-5'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <h2 className='font-extrabold'>Service review queue</h2>
                  <p className='mt-1 text-sm leading-6 text-[#667085]'>
                    Open Services, inspect the listing title, description, price, media status, seller, and quality score, then approve or reject it.
                  </p>
                </div>
                <Button className='bg-[#101828] text-white hover:bg-[#1f2937]' onClick={() => setTab('Services')}>
                  Review services
                </Button>
              </div>
            </div>
          </div>
        )}

        {tab === 'Users' && (
          <div className='grid gap-3'>
            {users.map((item) => {
              const sellerProfile = first(item.seller_profile)
              return (
                <div key={item.id} className='rounded-lg border border-[#eadfce] bg-white p-4'>
                  <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
                    <div>
                      <p className='font-extrabold'>{item.full_name || item.email}</p>
                      <p className='mt-1 text-xs text-[#667085]'>{item.email} - {item.role} - risk {item.risk_score}</p>
                      {sellerProfile && <p className='mt-1 text-xs text-[#8a5a18]'>Seller: {sellerProfile.verification_status} - {sellerProfile.profile_completion_score}%</p>}
                    </div>
                    <div className='flex w-full flex-wrap gap-2 lg:max-w-xl lg:justify-end'>
                      <DecisionNote noteKey={`user-${item.id}`} placeholder='Moderator note or reason for this user decision' />
                      {sellerProfile && (
                        <>
                          <Button size='sm' onClick={() => runAction(`verify-${item.id}`, async () => {
                            const { error } = await supabase.rpc('admin_set_seller_verification', { target_user_id: item.id, next_status: 'verified', note: decisionNote(`user-${item.id}`, 'Approved for beta') })
                            if (error) throw error
                          })}>
                            Verify
                          </Button>
                          <Button size='sm' variant='outline' onClick={() => runAction(`reject-seller-${item.id}`, async () => {
                            const { error } = await supabase.rpc('admin_set_seller_verification', { target_user_id: item.id, next_status: 'rejected', note: decisionNote(`user-${item.id}`, 'Needs more proof') })
                            if (error) throw error
                          })}>
                            Reject seller
                          </Button>
                        </>
                      )}
                      <Button size='sm' variant='outline' onClick={() => runAction(`warn-${item.id}`, async () => {
                        const { error } = await supabase.rpc('admin_moderate_user', { target_user_id: item.id, next_status: 'warned', reason: decisionNote(`user-${item.id}`, 'Beta conduct warning'), next_risk_score: Math.max(item.risk_score, 25) })
                        if (error) throw error
                      })}>
                        Warn
                      </Button>
                      <Button size='sm' variant='outline' onClick={() => runAction(`restrict-${item.id}`, async () => {
                        const { error } = await supabase.rpc('admin_moderate_user', { target_user_id: item.id, next_status: 'restricted', reason: decisionNote(`user-${item.id}`, 'Account restricted for safety review'), next_risk_score: Math.max(item.risk_score, 65) })
                        if (error) throw error
                      })}>
                        Restrict
                      </Button>
                      {item.moderation_status !== 'active' && (
                        <Button size='sm' variant='outline' onClick={() => runAction(`restore-${item.id}`, async () => {
                          const { error } = await supabase.rpc('admin_moderate_user', { target_user_id: item.id, next_status: 'active', reason: decisionNote(`user-${item.id}`, 'Account restored after review'), next_risk_score: Math.min(item.risk_score, 10) })
                          if (error) throw error
                        })}>
                          Restore
                        </Button>
                      )}
                      <Button size='sm' variant='destructive' disabled={item.id === currentUserId} onClick={() => runAction(`ban-${item.id}`, async () => {
                        const { error } = await supabase.rpc('admin_moderate_user', { target_user_id: item.id, next_status: 'banned', reason: decisionNote(`user-${item.id}`, 'Beta safety restriction'), next_risk_score: 100 })
                        if (error) throw error
                      })}>
                        Ban
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'Services' && (
          <ModerationList
            rows={services}
            renderTitle={(item) => item.title}
            renderMeta={(item) =>
              `${item.category} - ${formatCurrency(item.price)} - ${item.delivery_days || 3}d - quality ${item.quality_score} - ${item.media_url ? 'media uploaded' : 'no media'} - ${item.seller?.full_name || 'Seller'}`
            }
            renderStatus={(item) => item.moderation_status}
            renderDescription={(item) => item.description || 'No description provided.'}
            actions={(item) => (
              <>
                <DecisionNote noteKey={`service-${item.id}`} placeholder='Approval, pause, or rejection reason' />
                <Button size='sm' onClick={() => runAction(`service-active-${item.id}`, async () => {
                  const { error } = await supabase.rpc('admin_moderate_service', { target_service_id: item.id, next_status: 'active', reason: decisionNote(`service-${item.id}`, 'Approved for beta') })
                  if (error) throw error
                })}><Check className='mr-1 h-4 w-4' />Approve</Button>
                <Button size='sm' variant='outline' onClick={() => runAction(`service-pause-${item.id}`, async () => {
                  const { error } = await supabase.rpc('admin_moderate_service', { target_service_id: item.id, next_status: 'paused', reason: decisionNote(`service-${item.id}`, 'Paused for review') })
                  if (error) throw error
                })}>Pause</Button>
                <Button size='sm' variant='destructive' onClick={() => runAction(`service-reject-${item.id}`, async () => {
                  const { error } = await supabase.rpc('admin_moderate_service', { target_service_id: item.id, next_status: 'rejected', reason: decisionNote(`service-${item.id}`, 'Rejected by moderation') })
                  if (error) throw error
                })}><X className='mr-1 h-4 w-4' />Reject</Button>
              </>
            )}
          />
        )}

        {tab === 'Orders' && (
          <ModerationList
            rows={[...pendingPaymentOrders, ...orders.filter((item) => item.order_status !== 'PENDING_PAYMENT')]}
            renderTitle={(item) => item.title}
            renderMeta={(item) =>
              `${item.buyer?.full_name || 'Buyer'} / ${item.seller?.full_name || 'Seller'} - ${formatCurrency(item.amount)} - payment ${item.payment_status} - ${formatTimeAgo(item.created_at)}`
            }
            renderStatus={(item) => item.order_status}
            renderDescription={(item) => item.dispute_reason || item.buyer_requirements || 'No order note captured.'}
            actions={(item) => (
              <>
                {item.order_status === 'PENDING_PAYMENT' ? (
                  <>
                    <DecisionNote noteKey={`order-payment-${item.id}`} placeholder='Payment confirmation note, receipt reference, or provider detail' />
                    <Button size='sm' onClick={() => runAction(`order-paid-${item.id}`, async () => {
                      const { error } = await supabase.rpc('admin_confirm_order_payment', {
                        target_order_id: item.id,
                        target_payment_method: 'loveworld_espees',
                        confirmation_note: decisionNote(`order-payment-${item.id}`, 'Payment manually confirmed by admin'),
                      })
                      if (error) throw error
                    })}>
                      <CreditCard className='mr-1 h-4 w-4' />
                      Confirm paid
                    </Button>
                  </>
                ) : (
                  <span className='text-xs font-bold text-[#667085]'>No payment action needed.</span>
                )}
              </>
            )}
          />
        )}

        {tab === 'Reviews' && (
          <ModerationList
            rows={reviews}
            renderTitle={(item) => item.comment || `Review rating ${item.rating}`}
            renderMeta={(item) => `${item.buyer?.full_name || 'Buyer'} -> ${item.seller?.full_name || 'Seller'} - ${formatTimeAgo(item.created_at)}`}
            renderStatus={(item) => item.status}
            actions={(item) => (
              <>
                <DecisionNote noteKey={`review-${item.id}`} placeholder='Review moderation note' />
                <Button size='sm' onClick={() => runAction(`review-pub-${item.id}`, async () => {
                  const { error } = await supabase.rpc('admin_moderate_review', { target_review_id: item.id, next_status: 'published', note: decisionNote(`review-${item.id}`, 'Visible after review') })
                  if (error) throw error
                })}>Publish</Button>
                <Button size='sm' variant='outline' onClick={() => runAction(`review-flag-${item.id}`, async () => {
                  const { error } = await supabase.rpc('admin_moderate_review', { target_review_id: item.id, next_status: 'flagged', note: decisionNote(`review-${item.id}`, 'Needs review') })
                  if (error) throw error
                })}>Flag</Button>
                <Button size='sm' variant='destructive' onClick={() => runAction(`review-hide-${item.id}`, async () => {
                  const { error } = await supabase.rpc('admin_moderate_review', { target_review_id: item.id, next_status: 'hidden', note: decisionNote(`review-${item.id}`, 'Hidden by moderation') })
                  if (error) throw error
                })}>Hide</Button>
              </>
            )}
          />
        )}

        {tab === 'Documents' && (
          <ModerationList
            rows={documents}
            renderTitle={(item) => item.file_name}
            renderMeta={(item) =>
              `${item.order?.title || 'Order'} - ${item.uploader?.full_name || item.uploader?.email || 'Uploader'} - ${formatTimeAgo(item.created_at)}`
            }
            renderStatus={(item) => item.review_status}
            renderDescription={(item) => item.review_note || 'Requirement file attached to an order for creator and moderation review.'}
            actions={(item) => (
              <>
                <DecisionNote noteKey={`document-${item.id}`} placeholder='Document review note' />
                <a href={item.file_url} target='_blank' rel='noreferrer' className='inline-flex h-9 items-center rounded-lg border border-[#eadfce] bg-white px-3 text-xs font-extrabold text-[#101828]'>
                  View file
                </a>
                <Button size='sm' onClick={() => runAction(`doc-approve-${item.id}`, async () => {
                  const { error } = await supabase.rpc('admin_review_order_document', { target_document_id: item.id, next_status: 'approved', note: decisionNote(`document-${item.id}`, 'Approved for order workflow') })
                  if (error) throw error
                })}>Approve</Button>
                <Button size='sm' variant='destructive' onClick={() => runAction(`doc-reject-${item.id}`, async () => {
                  const { error } = await supabase.rpc('admin_review_order_document', { target_document_id: item.id, next_status: 'rejected', note: decisionNote(`document-${item.id}`, 'Rejected by moderation') })
                  if (error) throw error
                })}>Reject</Button>
              </>
            )}
          />
        )}

        {tab === 'Reports' && (
          <ModerationList
            rows={reports}
            renderTitle={(item) => `${item.target_type}: ${item.reason}`}
            renderMeta={(item) => `${item.priority} priority - ${item.reporter?.email || 'Reporter'} - ${formatTimeAgo(item.created_at)}`}
            renderStatus={(item) => item.status}
            actions={(item) => (
              <>
                <DecisionNote noteKey={`report-${item.id}`} placeholder='Resolution note or moderation findings' />
                <Button size='sm' variant='outline' onClick={() => runAction(`report-review-${item.id}`, async () => {
                  const { error } = await supabase.rpc('admin_resolve_report', { target_report_id: item.id, next_status: 'reviewing', resolution_note: decisionNote(`report-${item.id}`, 'Admin reviewing') })
                  if (error) throw error
                })}>Review</Button>
                <Button size='sm' onClick={() => runAction(`report-resolve-${item.id}`, async () => {
                  const { error } = await supabase.rpc('admin_resolve_report', { target_report_id: item.id, next_status: 'resolved', resolution_note: decisionNote(`report-${item.id}`, 'Resolved by moderation') })
                  if (error) throw error
                })}>Resolve</Button>
                <Button size='sm' variant='ghost' onClick={() => runAction(`report-dismiss-${item.id}`, async () => {
                  const { error } = await supabase.rpc('admin_resolve_report', { target_report_id: item.id, next_status: 'dismissed', resolution_note: decisionNote(`report-${item.id}`, 'Dismissed after review') })
                  if (error) throw error
                })}>Dismiss</Button>
              </>
            )}
          />
        )}

        {tab === 'Disputes' && (
          <div className='grid gap-5 xl:grid-cols-[1fr_380px]'>
            <ModerationList
              rows={disputes}
              renderTitle={(item) => item.title}
              renderMeta={(item) => `${item.buyer?.full_name || 'Buyer'} / ${item.seller?.full_name || 'Seller'} - ${formatCurrency(item.amount)} - ${item.dispute_reason || 'No dispute note'}`}
              renderStatus={(item) => item.order_status}
              actions={() => <span className='text-xs font-bold text-[#667085]'>Refunds are placeholders until provider integration.</span>}
            />
            <div className='rounded-lg border border-[#eadfce] bg-white p-5'>
              <h2 className='font-extrabold'>Manual adjustment</h2>
              <div className='mt-4 space-y-3'>
                <Input placeholder='User ID' value={adjustmentDraft.userId} onChange={(event) => setAdjustmentDraft((current) => ({ ...current, userId: event.target.value }))} />
                <Input placeholder='Order ID optional' value={adjustmentDraft.orderId} onChange={(event) => setAdjustmentDraft((current) => ({ ...current, orderId: event.target.value }))} />
                <select className='w-full rounded-lg border border-[#eadfce] bg-white px-3 py-2 text-sm' value={adjustmentDraft.type} onChange={(event) => setAdjustmentDraft((current) => ({ ...current, type: event.target.value }))}>
                  <option value='refund_placeholder'>Refund placeholder</option>
                  <option value='credit_placeholder'>Credit placeholder</option>
                  <option value='debit_placeholder'>Debit placeholder</option>
                  <option value='fee_correction'>Fee correction</option>
                </select>
                <Input type='number' min='0' placeholder='Amount' value={adjustmentDraft.amount} onChange={(event) => setAdjustmentDraft((current) => ({ ...current, amount: event.target.value }))} />
                <Input placeholder='Reason' value={adjustmentDraft.reason} onChange={(event) => setAdjustmentDraft((current) => ({ ...current, reason: event.target.value }))} />
                <Button className='w-full' onClick={recordAdjustment} disabled={busy === 'adjustment'}>Record adjustment</Button>
              </div>
              <div className='mt-5 space-y-2'>
                {adjustments.slice(0, 6).map((item) => (
                  <div key={item.id} className='rounded-lg bg-[#fffdf8] p-3 text-xs'>
                    <p className='font-bold'>{item.adjustment_type} - {formatCurrency(item.amount)}</p>
                    <p className='mt-1 text-[#667085]'>{item.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'Categories' && (
          <div className='grid gap-5 lg:grid-cols-[360px_1fr]'>
            <div className='rounded-lg border border-[#eadfce] bg-white p-5'>
              <h2 className='font-extrabold'>Category management</h2>
              <div className='mt-4 space-y-3'>
                <Input placeholder='Name' value={categoryDraft.name} onChange={(event) => setCategoryDraft((current) => ({ ...current, name: event.target.value }))} />
                <Input placeholder='Slug' value={categoryDraft.slug} onChange={(event) => setCategoryDraft((current) => ({ ...current, slug: event.target.value }))} />
                <Input placeholder='Description' value={categoryDraft.description} onChange={(event) => setCategoryDraft((current) => ({ ...current, description: event.target.value }))} />
                <Input placeholder='Icon' value={categoryDraft.icon} onChange={(event) => setCategoryDraft((current) => ({ ...current, icon: event.target.value }))} />
                <label className='flex items-center justify-between rounded-lg bg-[#fffdf8] px-3 py-2 text-sm font-bold'>
                  Active
                  <input type='checkbox' checked={categoryDraft.active} onChange={(event) => setCategoryDraft((current) => ({ ...current, active: event.target.checked }))} />
                </label>
                <Button className='w-full' onClick={upsertCategory} disabled={busy === 'category'}><SlidersHorizontal className='mr-2 h-4 w-4' />Save category</Button>
              </div>
            </div>
            <ModerationList
              rows={categories}
              renderTitle={(item) => item.name}
              renderMeta={(item) => `${item.slug} - sort ${item.sort_order}`}
              renderStatus={(item) => (item.is_active ? 'active' : 'archived')}
              actions={() => null}
            />
          </div>
        )}

        {tab === 'Audit' && (
          <ModerationList
            rows={audits}
            renderTitle={(item) => item.action}
            renderMeta={(item) => `${item.target_type} - ${item.target_id || 'n/a'} - ${formatTimeAgo(item.created_at)}`}
            renderStatus={() => 'recorded'}
            actions={() => null}
          />
        )}
      </div>
    </div>
  )
}

function ModerationList<T extends { id: string }>({
  rows,
  renderTitle,
  renderMeta,
  renderStatus,
  renderDescription,
  actions,
}: {
  rows: T[]
  renderTitle: (row: T) => string
  renderMeta: (row: T) => string
  renderStatus: (row: T) => string
  renderDescription?: (row: T) => string
  actions: (row: T) => ReactNode
}) {
  return (
    <div className='grid gap-3'>
      {rows.map((row) => {
        const status = renderStatus(row)
        return (
          <div key={row.id} className='rounded-lg border border-[#eadfce] bg-white p-4'>
            <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
              <div className='min-w-0'>
                <div className='flex flex-wrap items-center gap-2'>
                  <p className='truncate font-extrabold'>{renderTitle(row)}</p>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${badgeClass(status)}`}>{status}</span>
                </div>
                <p className='mt-1 text-xs leading-5 text-[#667085]'>{renderMeta(row)}</p>
                {renderDescription && (
                  <p className='mt-2 line-clamp-2 max-w-3xl text-xs leading-5 text-[#5b6472]'>
                    {renderDescription(row)}
                  </p>
                )}
              </div>
              <div className='flex w-full flex-wrap gap-2 lg:max-w-xl lg:justify-end'>{actions(row)}</div>
            </div>
          </div>
        )
      })}
      {!rows.length && (
        <div className='rounded-lg border border-dashed border-[#d8c9b5] bg-white p-8 text-center text-sm text-[#667085]'>
          <Flag className='mx-auto mb-3 h-8 w-8 text-[#b97822]' />
          Nothing in this queue.
        </div>
      )}
    </div>
  )
}
