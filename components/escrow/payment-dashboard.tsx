'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, CreditCard, Loader2, PackageCheck, RefreshCw, Send, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase-client'
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh'
import { userFilter, userScopedChannel } from '@/lib/realtime/channels'
import {
  acceptMarketplaceDeliveryAction,
  confirmBetaPaymentAction,
  deliverMarketplaceOrderAction,
  requestOrderRevisionAction,
  requestWithdrawalAction,
} from '@/app/actions/escrow'
import { formatCurrency, formatTimeAgo } from '@/lib/utils'
import { Database } from '@/types/database'

type WalletRow = Database['public']['Tables']['wallets']['Row']
type OrderRow = Database['public']['Tables']['orders']['Row'] & {
  buyer?: { full_name: string | null } | null
  seller?: { full_name: string | null } | null
}
type TransactionRow = Database['public']['Tables']['transactions']['Row']
type WithdrawalRow = Database['public']['Tables']['withdrawals']['Row']

function statusClass(status: string) {
  if (['PAID', 'ACTIVE', 'COMPLETED', 'APPROVED'].includes(status)) return 'bg-[#dcfce7] text-[#166534]'
  if (['DELIVERED', 'PENDING', 'PENDING_PAYMENT'].includes(status)) return 'bg-[#fef3c7] text-[#92400e]'
  if (['REJECTED', 'CANCELLED', 'DISPUTED'].includes(status)) return 'bg-[#fee2e2] text-[#991b1b]'
  return 'bg-[#e5e7eb] text-[#374151]'
}

async function getAccessToken(supabase: ReturnType<typeof createClient>) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Sign in again to continue')
  }

  return session.access_token
}

export default function PaymentDashboard() {
  const supabase = useMemo(() => createClient(), [])
  const [userId, setUserId] = useState<string | null>(null)
  const [wallet, setWallet] = useState<WalletRow | null>(null)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [deliveryMessage, setDeliveryMessage] = useState('Here is the completed work for your review.')
  const [revisionMessage, setRevisionMessage] = useState('Please revise this delivery with the notes shared here.')
  const [withdrawal, setWithdrawal] = useState({
    amount: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
  })

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    setUserId(user.id)

    const [walletResult, ordersResult, transactionsResult, withdrawalsResult] = await Promise.all([
      supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('orders')
        .select('*, buyer:users!orders_buyer_id_fkey(full_name), seller:users!orders_seller_id_fkey(full_name)')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(25),
      supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    ])

    if (walletResult.error) console.error(walletResult.error)
    if (ordersResult.error) console.error(ordersResult.error)
    if (transactionsResult.error) console.error(transactionsResult.error)
    if (withdrawalsResult.error) console.error(withdrawalsResult.error)

    setWallet((walletResult.data as WalletRow | null) || null)
    setOrders((ordersResult.data as unknown as OrderRow[]) || [])
    setTransactions((transactionsResult.data as TransactionRow[]) || [])
    setWithdrawals((withdrawalsResult.data as WithdrawalRow[]) || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const realtimeWatches = useMemo(
    () =>
      userId
        ? [
            { table: 'wallets', filter: userFilter(userId) },
            { table: 'orders', filter: `buyer_id=eq.${userId}` },
            { table: 'orders', filter: `seller_id=eq.${userId}` },
            { table: 'transactions', filter: userFilter(userId) },
            { table: 'withdrawals', filter: userFilter(userId) },
          ]
        : [],
    [userId]
  )

  useRealtimeRefresh(
    supabase,
    userId ? userScopedChannel('escrow-dashboard', userId) : null,
    realtimeWatches,
    loadData
  )

  const runAction = async (key: string, action: (token: string) => Promise<unknown>) => {
    setBusy(key)
    try {
      const token = await getAccessToken(supabase)
      await action(token)
      toast.success('Updated successfully')
      await loadData()
    } catch (error: any) {
      toast.error(error.message || 'Action failed')
    } finally {
      setBusy(null)
    }
  }

  const submitWithdrawal = async (event: FormEvent) => {
    event.preventDefault()
    await runAction('withdrawal', (token) =>
      requestWithdrawalAction(token, {
        amount: Math.round(Number(withdrawal.amount)),
        bankName: withdrawal.bankName,
        accountName: withdrawal.accountName,
        accountNumber: withdrawal.accountNumber,
      })
    )
    setWithdrawal({ amount: '', bankName: '', accountName: '', accountNumber: '' })
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-[#f6f0e7] px-3 py-5 sm:px-5'>
        <div className='mx-auto max-w-[1400px]'>
          <div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
            <div>
              <Skeleton className='h-9 w-72 max-w-full' />
              <Skeleton className='mt-3 h-4 w-96 max-w-full' />
            </div>
            <Skeleton className='h-10 w-28' />
          </div>
          <div className='mb-6 grid gap-4 md:grid-cols-3'>
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className='h-28 w-full' />
            ))}
          </div>
          <div className='grid gap-5 xl:grid-cols-[1fr_380px]'>
            <Skeleton className='h-[520px] w-full' />
            <div className='space-y-5'>
              <Skeleton className='h-72 w-full' />
              <Skeleton className='h-60 w-full' />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className='grid min-h-[70vh] place-items-center px-4 text-center'>
        <div>
          <Wallet className='mx-auto h-10 w-10 text-[#b97822]' />
          <h1 className='mt-4 text-2xl font-extrabold'>Sign in to manage payments</h1>
          <p className='mt-2 text-sm text-[#667085]'>Wallet and order data is private to your account.</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#f6f0e7] px-3 py-5 sm:px-5'>
      <div className='mx-auto max-w-[1400px]'>
        <div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h1 className='text-3xl font-extrabold'>Payments & orders</h1>
            <p className='mt-1 text-sm text-[#667085]'>Beta payment system for protected marketplace workflows. This is not connected to a live payment provider yet.</p>
          </div>
          <Button variant='outline' className='border-[#eadfce] bg-white' onClick={() => loadData()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
        </div>

        <div className='mb-6 grid gap-4 md:grid-cols-3'>
          <div className='rounded-lg border border-[#eadfce] bg-white p-5'>
            <div className='flex items-center justify-between'>
              <p className='text-sm font-bold text-[#667085]'>Available</p>
              <Wallet className='h-5 w-5 text-[#b97822]' />
            </div>
            <p className='mt-3 text-3xl font-extrabold'>{formatCurrency(wallet?.available_balance || 0)}</p>
          </div>
          <div className='rounded-lg border border-[#eadfce] bg-white p-5'>
            <div className='flex items-center justify-between'>
              <p className='text-sm font-bold text-[#667085]'>Pending Beta Balance</p>
              <PackageCheck className='h-5 w-5 text-[#b97822]' />
            </div>
            <p className='mt-3 text-3xl font-extrabold'>{formatCurrency(wallet?.pending_balance || 0)}</p>
          </div>
          <div className='rounded-lg border border-[#eadfce] bg-white p-5'>
            <div className='flex items-center justify-between'>
              <p className='text-sm font-bold text-[#667085]'>Orders</p>
              <CreditCard className='h-5 w-5 text-[#b97822]' />
            </div>
            <p className='mt-3 text-3xl font-extrabold'>{orders.length}</p>
          </div>
        </div>

        <div className='grid gap-5 xl:grid-cols-[1fr_380px]'>
          <section className='rounded-lg border border-[#eadfce] bg-white'>
            <div className='border-b border-[#eadfce] p-5'>
              <h2 className='text-xl font-extrabold'>Protected order workflow</h2>
              <p className='mt-1 text-sm text-[#667085]'>Confirm beta payments, deliver work, approve delivery, or request revisions.</p>
            </div>
            <div className='divide-y divide-[#eadfce]'>
              {orders.map((order) => {
                const isBuyer = order.buyer_id === userId
                const isSeller = order.seller_id === userId

                return (
                  <div key={order.id} className='p-5'>
                    <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
                      <div>
                        <div className='flex flex-wrap items-center gap-2'>
                          <h3 className='font-extrabold'>{order.title}</h3>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass(order.order_status)}`}>
                            {order.order_status}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass(order.payment_status)}`}>
                            {order.payment_status}
                          </span>
                        </div>
                        <p className='mt-2 text-sm text-[#667085]'>
                          {isBuyer ? `Seller: ${order.seller?.full_name || 'Seller'}` : `Buyer: ${order.buyer?.full_name || 'Buyer'}`}
                        </p>
                        <div className='mt-3 grid gap-2 text-sm sm:grid-cols-3'>
                          <span>Amount: <b>{formatCurrency(order.amount)}</b></span>
                          <span>Platform fee: <b>{formatCurrency(order.escrow_fee_amount)}</b></span>
                          <span>Seller earns: <b>{formatCurrency(order.seller_earnings)}</b></span>
                        </div>
                        {order.buyer_requirements && (
                          <p className='mt-3 line-clamp-2 text-sm text-[#667085]'>
                            Requirements: {order.buyer_requirements}
                          </p>
                        )}
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        <Link href={`/dashboard/orders/${order.id}`}>
                          <Button size='sm' variant='outline'>Details</Button>
                        </Link>
                        {isBuyer && order.order_status === 'PENDING_PAYMENT' && (
                          <Button
                            size='sm'
                            disabled={busy === `pay-${order.id}`}
                            onClick={() => runAction(`pay-${order.id}`, (token) => confirmBetaPaymentAction(token, order.id, order.amount))}
                          >
                            <CreditCard className='mr-2 h-4 w-4' />
                            Confirm beta payment
                          </Button>
                        )}
                        {isSeller && ['ACTIVE', 'REVISION_REQUESTED'].includes(order.order_status) && (
                          <Button
                            size='sm'
                            disabled={busy === `deliver-${order.id}`}
                            onClick={() =>
                              runAction(`deliver-${order.id}`, (token) =>
                                deliverMarketplaceOrderAction(token, {
                                  orderId: order.id,
                                  message: deliveryMessage,
                                })
                              )
                            }
                          >
                            <Send className='mr-2 h-4 w-4' />
                            Deliver Work
                          </Button>
                        )}
                        {isBuyer && order.order_status === 'DELIVERED' && (
                          <>
                            <Button
                              size='sm'
                              disabled={busy === `accept-${order.id}`}
                              onClick={() => runAction(`accept-${order.id}`, (token) => acceptMarketplaceDeliveryAction(token, order.id))}
                            >
                              <CheckCircle2 className='mr-2 h-4 w-4' />
                              Accept Delivery
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              disabled={busy === `revision-${order.id}`}
                              onClick={() => runAction(`revision-${order.id}`, (token) => requestOrderRevisionAction(token, order.id, revisionMessage))}
                            >
                              Request Revision
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {!orders.length && (
                <div className='p-10 text-center'>
                  <PackageCheck className='mx-auto h-9 w-9 text-[#b97822]' />
                  <h3 className='mt-3 text-base font-extrabold text-[#101828]'>No active order workflows</h3>
                  <p className='mx-auto mt-2 max-w-sm text-sm leading-6 text-[#667085]'>
                    Orders created from checkout will appear here with payment, delivery, revision, and completion steps.
                  </p>
                  <Link href='/marketplace'>
                    <Button className='mt-5 bg-[#101828] text-white hover:bg-[#1f2937]'>Browse services</Button>
                  </Link>
                </div>
              )}
            </div>
          </section>

          <aside className='space-y-5'>
            <form onSubmit={submitWithdrawal} className='rounded-lg border border-[#eadfce] bg-white p-5'>
              <h2 className='text-lg font-extrabold'>Request withdrawal</h2>
              <p className='mt-1 text-sm text-[#667085]'>MVP withdrawals are reviewed and paid manually by admin.</p>
              <div className='mt-5 space-y-4'>
                <div>
                  <Label htmlFor='amount'>Amount</Label>
                  <Input
                    id='amount'
                    type='number'
                    min='1'
                    value={withdrawal.amount}
                    onChange={(event) => setWithdrawal((current) => ({ ...current, amount: event.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor='bank'>Bank name</Label>
                  <Input
                    id='bank'
                    value={withdrawal.bankName}
                    onChange={(event) => setWithdrawal((current) => ({ ...current, bankName: event.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor='accountName'>Account name</Label>
                  <Input
                    id='accountName'
                    value={withdrawal.accountName}
                    onChange={(event) => setWithdrawal((current) => ({ ...current, accountName: event.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor='accountNumber'>Account number</Label>
                  <Input
                    id='accountNumber'
                    value={withdrawal.accountNumber}
                    onChange={(event) => setWithdrawal((current) => ({ ...current, accountNumber: event.target.value }))}
                    required
                  />
                </div>
                <Button className='w-full' disabled={busy === 'withdrawal'}>
                  Request withdrawal
                </Button>
              </div>
            </form>

            <div className='rounded-lg border border-[#eadfce] bg-white p-5'>
              <h2 className='text-lg font-extrabold'>Delivery defaults</h2>
              <div className='mt-4 space-y-4'>
                <div>
                  <Label htmlFor='deliveryMessage'>Delivery message</Label>
                  <Textarea id='deliveryMessage' value={deliveryMessage} onChange={(event) => setDeliveryMessage(event.target.value)} />
                </div>
                <div>
                  <Label htmlFor='revisionMessage'>Revision message</Label>
                  <Textarea id='revisionMessage' value={revisionMessage} onChange={(event) => setRevisionMessage(event.target.value)} />
                </div>
              </div>
            </div>

            <div className='rounded-lg border border-[#eadfce] bg-white p-5'>
              <h2 className='text-lg font-extrabold'>Recent Transactions</h2>
              <div className='mt-4 space-y-3'>
                {transactions.map((transaction) => (
                  <div key={transaction.id} className='flex items-center justify-between rounded-lg bg-[#fffdf8] p-3'>
                    <div>
                      <p className='text-sm font-bold'>{transaction.type}</p>
                      <p className='text-xs text-[#98a2b3]'>{formatTimeAgo(transaction.created_at)}</p>
                    </div>
                    <p className='text-sm font-extrabold'>{formatCurrency(transaction.amount)}</p>
                  </div>
                ))}
                {!transactions.length && <p className='text-sm text-[#667085]'>No transactions yet.</p>}
              </div>
            </div>

            <div className='rounded-lg border border-[#eadfce] bg-white p-5'>
              <h2 className='text-lg font-extrabold'>Withdrawals</h2>
              <div className='mt-4 space-y-3'>
                {withdrawals.map((item) => (
                  <div key={item.id} className='rounded-lg bg-[#fffdf8] p-3'>
                    <div className='flex items-center justify-between'>
                      <p className='text-sm font-extrabold'>{formatCurrency(item.amount)}</p>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusClass(item.status)}`}>{item.status}</span>
                    </div>
                    <p className='mt-1 text-xs text-[#667085]'>{item.bank_name} - {item.account_number}</p>
                  </div>
                ))}
                {!withdrawals.length && <p className='text-sm text-[#667085]'>No withdrawals yet.</p>}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
