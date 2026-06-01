'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Coins, CreditCard, Download, FileText, MessageCircle, RefreshCw, Send, Star, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  acceptMarketplaceDeliveryAction,
  confirmBetaPaymentAction,
  deliverMarketplaceOrderAction,
  openOrderDisputeAction,
  requestOrderCancellationAction,
  requestOrderRevisionAction,
} from '@/app/actions/escrow'
import { submitCompletedOrderReviewAction } from '@/domains/reviews/actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase-client'
import { paymentMethods, type PaymentMethod } from '@/lib/payments/gateway'
import { formatCurrency, formatTimeAgo } from '@/lib/utils'
import { Database } from '@/types/database'

type OrderRow = Database['public']['Tables']['orders']['Row'] & {
  buyer?: { full_name: string | null } | null
  seller?: { full_name: string | null } | null
  service?: { title: string; slug: string | null } | null
}

type EventRow = Database['public']['Tables']['order_events']['Row'] & {
  actor?: { full_name: string | null } | null
}

type DeliverableRow = Database['public']['Tables']['deliverables']['Row']
type OrderDocumentRow = Database['public']['Tables']['order_documents']['Row'] & {
  uploader?: { full_name: string | null } | null
  reviewer?: { full_name: string | null } | null
}
type ReviewRow = Database['public']['Tables']['reviews']['Row']

async function getAccessToken(supabase: ReturnType<typeof createClient>) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) throw new Error('Sign in again to continue')
  return session.access_token
}

function badgeClass(status: string) {
  if (['PAID', 'ACTIVE', 'COMPLETED'].includes(status)) return 'bg-[#dcfce7] text-[#166534]'
  if (['DELIVERED', 'PENDING', 'PENDING_PAYMENT', 'REVISION_REQUESTED'].includes(status)) return 'bg-[#fef3c7] text-[#92400e]'
  if (['CANCELLED', 'DISPUTED', 'REFUNDED'].includes(status)) return 'bg-[#fee2e2] text-[#991b1b]'
  return 'bg-[#e5e7eb] text-[#374151]'
}

export function OrderDetailClient({
  order,
  events,
  deliverables,
  documents,
  review,
  currentUserId,
  onUpdated,
}: {
  order: OrderRow
  events: EventRow[]
  deliverables: DeliverableRow[]
  documents: OrderDocumentRow[]
  review: ReviewRow | null
  currentUserId: string
  onUpdated: () => Promise<void>
}) {
  const supabase = useMemo(() => createClient(), [])
  const [busy, setBusy] = useState<string | null>(null)
  const [deliveryMessage, setDeliveryMessage] = useState('Here is the completed work for review.')
  const [revisionMessage, setRevisionMessage] = useState('')
  const [riskReason, setRiskReason] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('loveworld_espees')

  const isBuyer = order.buyer_id === currentUserId
  const isSeller = order.seller_id === currentUserId

  const runAction = async (key: string, action: (token: string) => Promise<unknown>) => {
    setBusy(key)
    try {
      const token = await getAccessToken(supabase)
      await action(token)
      toast.success('Order updated')
      await onUpdated()
    } catch (error: any) {
      toast.error(error.message || 'Action failed')
    } finally {
      setBusy(null)
    }
  }

  const runValidatedAction = async (
    key: string,
    value: string,
    message: string,
    action: (token: string) => Promise<unknown>
  ) => {
    if (value.trim().length < 10) {
      toast.error(message)
      return
    }

    await runAction(key, action)
  }

  const submitReview = async (event: FormEvent) => {
    event.preventDefault()
    await runAction('review', (token) =>
      submitCompletedOrderReviewAction(token, {
        orderId: order.id,
        rating,
        comment,
      })
    )
  }

  const timeline = [
    ['Checkout', Boolean(order.terms_accepted_at), order.terms_accepted_at || order.created_at],
    ['Payment', order.payment_status === 'PAID', order.updated_at],
    ['Delivery', Boolean(order.delivered_at), order.delivered_at],
    ['Accepted', Boolean(order.accepted_at), order.accepted_at],
    ['Review', Boolean(review), review?.created_at],
  ] as const

  return (
    <div className='grid gap-5 lg:grid-cols-[1fr_360px]'>
      <main className='space-y-5'>
        <section className='rounded-lg border border-[#eadfce] bg-white p-5'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
            <div>
              <h1 className='text-3xl font-extrabold'>{order.title}</h1>
              <p className='mt-2 text-sm text-[#667085]'>
                {isBuyer ? `Seller: ${order.seller?.full_name || 'Seller'}` : `Buyer: ${order.buyer?.full_name || 'Buyer'}`}
              </p>
            </div>
            <div className='flex flex-wrap gap-2'>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${badgeClass(order.order_status)}`}>{order.order_status}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${badgeClass(order.payment_status)}`}>{order.payment_status}</span>
            </div>
          </div>
          <div className='mt-5 grid gap-3 sm:grid-cols-3'>
            <div className='rounded-lg bg-[#fffdf8] p-4'><p className='text-xs text-[#667085]'>Amount</p><p className='font-extrabold'>{formatCurrency(order.amount)}</p></div>
            <div className='rounded-lg bg-[#fffdf8] p-4'><p className='text-xs text-[#667085]'>Fee</p><p className='font-extrabold'>{formatCurrency(order.escrow_fee_amount)}</p></div>
            <div className='rounded-lg bg-[#fffdf8] p-4'><p className='text-xs text-[#667085]'>Seller earns</p><p className='font-extrabold'>{formatCurrency(order.seller_earnings)}</p></div>
          </div>
        </section>

        <section className='rounded-lg border border-[#eadfce] bg-white p-5'>
          <h2 className='font-extrabold'>Order timeline</h2>
          <div className='mt-4 grid gap-3 sm:grid-cols-5'>
            {timeline.map(([label, done, date]) => (
              <div key={label} className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-3'>
                <div className='flex items-center gap-2'>
                  {done ? <CheckCircle2 className='h-4 w-4 text-[#15803d]' /> : <RefreshCw className='h-4 w-4 text-[#98a2b3]' />}
                  <p className='text-sm font-bold'>{label}</p>
                </div>
                <p className='mt-2 text-xs text-[#667085]'>{date ? formatTimeAgo(date) : 'Waiting'}</p>
              </div>
            ))}
          </div>
        </section>

        <section className='rounded-lg border border-[#eadfce] bg-white p-5'>
          <h2 className='font-extrabold'>Buyer requirements</h2>
          <p className='mt-3 whitespace-pre-line text-sm leading-6 text-[#667085]'>{order.buyer_requirements || 'No requirements were captured.'}</p>
          {order.scope_confirmation && (
            <div className='mt-4 rounded-lg bg-[#fffdf8] p-4'>
              <h3 className='text-sm font-extrabold'>Scope confirmation</h3>
              <p className='mt-2 whitespace-pre-line text-sm leading-6 text-[#667085]'>{order.scope_confirmation}</p>
            </div>
          )}
        </section>

        <section className='rounded-lg border border-[#eadfce] bg-white p-5'>
          <h2 className='font-extrabold'>Requirement documents</h2>
          <div className='mt-4 space-y-3'>
            {documents.map((item) => (
              <div key={item.id} className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-4'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='min-w-0'>
                    <p className='flex min-w-0 items-center gap-2 text-sm font-extrabold text-[#101828]'>
                      <FileText className='h-4 w-4 shrink-0 text-[#8a5a18]' />
                      <span className='truncate'>{item.file_name}</span>
                    </p>
                    <p className='mt-1 text-xs text-[#667085]'>
                      {item.uploader?.full_name || 'Participant'} - {formatTimeAgo(item.created_at)}
                    </p>
                  </div>
                  <a href={item.file_url} target='_blank' rel='noreferrer' className='inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-[#101828] bg-white px-3 text-xs font-extrabold text-[#101828]'>
                    <Download className='mr-2 h-4 w-4' />
                    View
                  </a>
                </div>
                <div className='mt-3 flex flex-wrap items-center gap-2 text-xs'>
                  <span className={`rounded-full px-2 py-1 font-bold ${badgeClass(item.review_status)}`}>{item.review_status}</span>
                  {item.review_note && <span className='text-[#667085]'>Review: {item.review_note}</span>}
                </div>
              </div>
            ))}
            {!documents.length && <p className='text-sm text-[#667085]'>No requirement documents were uploaded for this order.</p>}
          </div>
        </section>

        <section className='rounded-lg border border-[#eadfce] bg-white p-5'>
          <h2 className='font-extrabold'>Deliveries</h2>
          <div className='mt-4 space-y-3'>
            {deliverables.map((item) => (
              <div key={item.id} className='rounded-lg bg-[#fffdf8] p-4'>
                <p className='text-sm leading-6'>{item.message}</p>
                <p className='mt-2 text-xs text-[#667085]'>{formatTimeAgo(item.delivered_at)}</p>
                {item.file_url && (
                  <a href={item.file_url} target='_blank' rel='noreferrer' className='mt-3 inline-flex items-center text-xs font-extrabold text-[#8a5a18]'>
                    <Download className='mr-1 h-4 w-4' />
                    {item.file_name || 'Download delivery file'}
                  </a>
                )}
              </div>
            ))}
            {!deliverables.length && <p className='text-sm text-[#667085]'>No delivery has been submitted yet.</p>}
          </div>
        </section>

        <section className='rounded-lg border border-[#eadfce] bg-white p-5'>
          <h2 className='font-extrabold'>Audit events</h2>
          <div className='mt-4 space-y-3'>
            {events.map((event) => (
              <div key={event.id} className='rounded-lg bg-[#fffdf8] p-3'>
                <p className='text-sm font-bold'>{event.event_type}</p>
                <p className='text-xs text-[#667085]'>{formatTimeAgo(event.created_at)} by {event.actor?.full_name || 'System'}</p>
              </div>
            ))}
            {!events.length && <p className='text-sm text-[#667085]'>Events will appear as the order moves forward.</p>}
          </div>
        </section>
      </main>

      <aside className='space-y-5'>
        <section className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
          <h2 className='font-extrabold'>Order actions</h2>
          <div className='mt-4 grid gap-2'>
            {isBuyer && order.order_status === 'PENDING_PAYMENT' && (
              <>
                <div className='grid gap-2'>
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition ${
                        paymentMethod === method.id ? 'border-[#101828] bg-white' : 'border-[#eadfce] bg-[#fffdf8]'
                      }`}
                    >
                      <input
                        type='radio'
                        name='orderPaymentMethod'
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className='mt-1 h-4 w-4'
                      />
                      <span>
                        <span className='flex items-center gap-2 font-extrabold text-[#101828]'>
                          {method.id === 'loveworld_espees' ? <Coins className='h-4 w-4 text-[#8a5a18]' /> : <CreditCard className='h-4 w-4 text-[#667085]' />}
                          {method.label}
                        </span>
                        <span className='mt-1 block text-xs leading-5 text-[#667085]'>{method.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <Button disabled={busy === 'pay'} onClick={() => runAction('pay', (token) => confirmBetaPaymentAction(token, order.id, order.amount, paymentMethod))}>
                  {paymentMethod === 'loveworld_espees' ? <Coins className='mr-2 h-4 w-4' /> : <CreditCard className='mr-2 h-4 w-4' />}
                  Confirm {paymentMethods.find((method) => method.id === paymentMethod)?.label}
                </Button>
              </>
            )}
            {isSeller && ['ACTIVE', 'REVISION_REQUESTED'].includes(order.order_status) && (
              <>
                <Textarea value={deliveryMessage} onChange={(event) => setDeliveryMessage(event.target.value)} />
                <Button
                  disabled={busy === 'deliver'}
                  onClick={() =>
                    runValidatedAction(
                      'deliver',
                      deliveryMessage,
                      'Add a clear delivery message before submitting',
                      (token) => deliverMarketplaceOrderAction(token, { orderId: order.id, message: deliveryMessage })
                    )
                  }
                >
                  <Send className='mr-2 h-4 w-4' />
                  Submit delivery
                </Button>
              </>
            )}
            {isBuyer && order.order_status === 'DELIVERED' && (
              <>
                <Button disabled={busy === 'accept'} onClick={() => runAction('accept', (token) => acceptMarketplaceDeliveryAction(token, order.id))}>
                  <CheckCircle2 className='mr-2 h-4 w-4' />
                  Accept delivery
                </Button>
                <Textarea value={revisionMessage} onChange={(event) => setRevisionMessage(event.target.value)} placeholder='Revision request notes' />
                <Button
                  variant='outline'
                  disabled={busy === 'revision'}
                  onClick={() =>
                    runValidatedAction(
                      'revision',
                      revisionMessage,
                      'Describe the revision needed before sending',
                      (token) => requestOrderRevisionAction(token, order.id, revisionMessage)
                    )
                  }
                >
                  Request revision
                </Button>
              </>
            )}
            <Link href='/dashboard/messages'>
              <Button variant='outline' className='w-full'>
                <MessageCircle className='mr-2 h-4 w-4' />
                Open inbox
              </Button>
            </Link>
          </div>
        </section>

        {isBuyer && order.order_status === 'COMPLETED' && (
          <form onSubmit={submitReview} className='rounded-lg border border-[#eadfce] bg-white p-5'>
            <h2 className='font-extrabold'>Verified review</h2>
            {review ? (
              <p className='mt-3 text-sm text-[#667085]'>You reviewed this completed order with {review.rating} stars.</p>
            ) : (
              <div className='mt-4 space-y-4'>
                <div>
                  <Label htmlFor='rating'>Rating</Label>
                  <select id='rating' value={rating} onChange={(event) => setRating(Number(event.target.value))} className='mt-2 h-10 w-full rounded-lg border border-[#eadfce] px-3'>
                    {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor='comment'>Review</Label>
                  <Textarea id='comment' value={comment} onChange={(event) => setComment(event.target.value)} />
                </div>
                <Button className='w-full' disabled={busy === 'review'}>
                  <Star className='mr-2 h-4 w-4' />
                  Submit verified review
                </Button>
              </div>
            )}
          </form>
        )}

        <section className='rounded-lg border border-[#eadfce] bg-white p-5'>
          <h2 className='font-extrabold'>Risk controls</h2>
          <p className='mt-2 text-sm leading-6 text-[#667085]'>{order.cancellation_policy || 'Cancellation requests are reviewed against marketplace policy.'}</p>
          <Textarea className='mt-4' value={riskReason} onChange={(event) => setRiskReason(event.target.value)} placeholder='Cancellation or dispute reason' />
          <div className='mt-3 grid gap-2'>
            {!['COMPLETED', 'CANCELLED', 'DISPUTED'].includes(order.order_status) && (
              <Button
                variant='outline'
                disabled={busy === 'cancel'}
                onClick={() =>
                  runValidatedAction(
                    'cancel',
                    riskReason,
                    'Add a cancellation reason before requesting review',
                    (token) => requestOrderCancellationAction(token, order.id, riskReason)
                  )
                }
              >
                <XCircle className='mr-2 h-4 w-4' />
                Request cancellation
              </Button>
            )}
            {!['COMPLETED', 'CANCELLED', 'DISPUTED'].includes(order.order_status) && (
              <Button
                variant='outline'
                disabled={busy === 'dispute'}
                onClick={() =>
                  runValidatedAction(
                    'dispute',
                    riskReason,
                    'Add a dispute reason before opening a dispute',
                    (token) => openOrderDisputeAction(token, order.id, riskReason)
                  )
                }
              >
                <AlertTriangle className='mr-2 h-4 w-4' />
                Open dispute
              </Button>
            )}
          </div>
        </section>
      </aside>
    </div>
  )
}
