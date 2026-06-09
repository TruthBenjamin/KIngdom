'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Loader2, RefreshCw, ShieldCheck, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { approveWithdrawalAction, rejectWithdrawalAction } from '@/app/actions/escrow'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase-client'
import { orderStatusLabel, orderStatusTone, withdrawalStatusLabel } from '@/lib/orders/status'
import { formatCurrency, formatTimeAgo } from '@/lib/utils'
import { Database } from '@/types/database'

type OrderRow = Database['public']['Tables']['orders']['Row'] & {
  buyer?: { full_name: string | null } | null
  seller?: { full_name: string | null } | null
}
type TransactionRow = Database['public']['Tables']['transactions']['Row']
type WithdrawalRow = Database['public']['Tables']['withdrawals']['Row'] & {
  user?: { full_name: string | null; email: string | null } | null
}
type RevenueRow = Database['public']['Tables']['platform_revenue']['Row']

async function getAccessToken(supabase: ReturnType<typeof createClient>) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Sign in again to continue')
  }

  return session.access_token
}

export default function AdminFinanceDashboard() {
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([])
  const [revenue, setRevenue] = useState<RevenueRow[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle()
    const admin = profile?.role === 'admin'
    setIsAdmin(admin)

    if (!admin) {
      setLoading(false)
      return
    }

    const [ordersResult, transactionsResult, withdrawalsResult, revenueResult] = await Promise.all([
      supabase
        .from('orders')
        .select('*, buyer:users!orders_buyer_id_fkey(full_name), seller:users!orders_seller_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(50),
      supabase
        .from('withdrawals')
        .select('*, user:users!withdrawals_user_id_fkey(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('platform_revenue').select('*').order('created_at', { ascending: false }).limit(100),
    ])

    setOrders((ordersResult.data as unknown as OrderRow[]) || [])
    setTransactions((transactionsResult.data as TransactionRow[]) || [])
    setWithdrawals((withdrawalsResult.data as unknown as WithdrawalRow[]) || [])
    setRevenue((revenueResult.data as RevenueRow[]) || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const runAction = async (key: string, action: (token: string) => Promise<unknown>) => {
    setBusy(key)
    try {
      const token = await getAccessToken(supabase)
      await action(token)
      toast.success('Admin action completed')
      await loadData()
    } catch (error: any) {
      toast.error(error.message || 'Admin action failed')
    } finally {
      setBusy(null)
    }
  }

  const platformRevenue = revenue.reduce((sum, item) => sum + item.amount, 0)
  const pendingWithdrawals = withdrawals.filter((item) => item.status === 'PENDING')
  const disputedOrders = orders.filter((item) => item.order_status === 'DISPUTED')

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
          <p className='mt-2 text-sm text-[#667085]'>Finance operations are restricted by Supabase RLS and admin checks.</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-white px-3 py-5 sm:px-5'>
      <div className='mx-auto max-w-[1500px]'>
        <div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h1 className='text-3xl font-extrabold'>Admin Finance</h1>
            <p className='mt-1 text-sm text-[#667085]'>Orders, beta payment transactions, withdrawals, disputes, and platform revenue.</p>
          </div>
          <Button variant='outline' className='border-[#eadfce] bg-white' onClick={() => loadData()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
        </div>

        <div className='mb-6 grid gap-4 md:grid-cols-4'>
          {[
            ['Platform Revenue', formatCurrency(platformRevenue)],
            ['Total Orders', orders.length.toString()],
            ['Pending Withdrawals', pendingWithdrawals.length.toString()],
            ['Disputes', disputedOrders.length.toString()],
          ].map(([label, value]) => (
            <div key={label} className='rounded-lg border border-[#eadfce] bg-white p-5'>
              <p className='text-sm font-bold text-[#667085]'>{label}</p>
              <p className='mt-3 text-3xl font-extrabold'>{value}</p>
            </div>
          ))}
        </div>

        <div className='grid gap-5 xl:grid-cols-[1fr_420px]'>
          <section className='rounded-lg border border-[#eadfce] bg-white'>
            <div className='border-b border-[#eadfce] p-5'>
              <h2 className='text-xl font-extrabold'>All Orders</h2>
            </div>
            <div className='overflow-x-auto'>
              <table className='w-full min-w-[760px] text-left text-sm'>
                <thead className='bg-[#fffdf8] text-xs uppercase text-[#667085]'>
                  <tr>
                    <th className='px-5 py-3'>Order</th>
                    <th className='px-5 py-3'>Buyer</th>
                    <th className='px-5 py-3'>Seller</th>
                    <th className='px-5 py-3'>Amount</th>
                    <th className='px-5 py-3'>Fee</th>
                    <th className='px-5 py-3'>Status</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-[#eadfce]'>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className='px-5 py-4 font-bold'>{order.title}</td>
                      <td className='px-5 py-4'>{order.buyer?.full_name || 'Buyer'}</td>
                      <td className='px-5 py-4'>{order.seller?.full_name || 'Seller'}</td>
                      <td className='px-5 py-4'>{formatCurrency(order.amount)}</td>
                      <td className='px-5 py-4'>{formatCurrency(order.escrow_fee_amount)}</td>
                      <td className='px-5 py-4'>
                        <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${orderStatusTone(order.order_status)}`}>
                          {orderStatusLabel(order.order_status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className='space-y-5'>
            <section className='rounded-lg border border-[#eadfce] bg-white p-5'>
              <h2 className='text-xl font-extrabold'>Withdrawal Approvals</h2>
              <div className='mt-4 space-y-3'>
                {withdrawals.map((item) => (
                  <div key={item.id} className='rounded-lg bg-[#fffdf8] p-4'>
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <p className='font-extrabold'>{formatCurrency(item.amount)}</p>
                        <p className='mt-1 text-xs text-[#667085]'>{item.user?.full_name || item.user?.email || 'Seller'}</p>
                        <p className='mt-1 text-xs text-[#667085]'>{item.bank_name} - {item.account_number}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${orderStatusTone(item.status)}`}>{withdrawalStatusLabel(item.status)}</span>
                    </div>
                    {item.status === 'PENDING' && (
                      <div className='mt-3 flex gap-2'>
                        <Button
                          size='sm'
                          disabled={busy === `approve-${item.id}`}
                          onClick={() => runAction(`approve-${item.id}`, (token) => approveWithdrawalAction(token, item.id))}
                        >
                          <Check className='mr-1 h-4 w-4' />
                          Approve
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          disabled={busy === `paid-${item.id}`}
                          onClick={() => runAction(`paid-${item.id}`, (token) => approveWithdrawalAction(token, item.id, true))}
                        >
                          Mark Paid
                        </Button>
                        <Button
                          size='sm'
                          variant='destructive'
                          disabled={busy === `reject-${item.id}`}
                          onClick={() => runAction(`reject-${item.id}`, (token) => rejectWithdrawalAction(token, item.id, 'Rejected by admin'))}
                        >
                          <X className='mr-1 h-4 w-4' />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {!withdrawals.length && <p className='text-sm text-[#667085]'>No withdrawals yet.</p>}
              </div>
            </section>

            <section className='rounded-lg border border-[#eadfce] bg-white p-5'>
              <h2 className='text-xl font-extrabold'>Recent Transactions</h2>
              <div className='mt-4 space-y-3'>
                {transactions.slice(0, 12).map((transaction) => (
                  <div key={transaction.id} className='flex items-center justify-between rounded-lg bg-[#fffdf8] p-3'>
                    <div>
                      <p className='text-sm font-bold'>{transaction.type}</p>
                      <p className='text-xs text-[#98a2b3]'>{formatTimeAgo(transaction.created_at)}</p>
                    </div>
                    <p className='text-sm font-extrabold'>{formatCurrency(transaction.amount)}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
