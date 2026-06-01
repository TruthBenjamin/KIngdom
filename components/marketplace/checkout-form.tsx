'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Coins, CreditCard, Loader2, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { createMarketplaceOrderAction } from '@/app/actions/escrow'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase-client'
import { paymentMethods, type PaymentMethod } from '@/lib/payments/gateway'
import { formatCurrency } from '@/lib/utils'

type CheckoutFormProps = {
  serviceId: string
  serviceTitle: string
  sellerName: string
  price: number
  fee: number
  sellerEarns: number
  requirements: string | null
  cancellationPolicy: string
}

async function getAccessToken(supabase: ReturnType<typeof createClient>) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) throw new Error('Sign in to continue')
  return session.access_token
}

export function CheckoutForm({
  serviceId,
  serviceTitle,
  sellerName,
  price,
  fee,
  sellerEarns,
  requirements,
  cancellationPolicy,
}: CheckoutFormProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [buyerRequirements, setBuyerRequirements] = useState('')
  const [scopeConfirmation, setScopeConfirmation] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('loveworld_espees')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (buyerRequirements.trim().length < 20) {
      toast.error('Add enough project detail for the seller to understand the work')
      return
    }
    if (!termsAccepted) {
      toast.error('Accept the marketplace terms before checkout')
      return
    }

    setBusy(true)
    try {
      const token = await getAccessToken(supabase)
      const orderId = await createMarketplaceOrderAction(token, serviceId, {
        requirements: buyerRequirements,
        scopeConfirmation,
        termsAccepted,
      })
      toast.success('Checkout saved. Confirm beta payment to start the order.')
      router.push(`/dashboard/orders/${orderId}`)
    } catch (error: any) {
      toast.error(error.message || 'Could not create order')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className='grid gap-5 lg:grid-cols-[1fr_360px]'>
      <section className='space-y-5 rounded-lg border border-[#eadfce] bg-white p-5'>
        <div>
          <h1 className='text-3xl font-extrabold text-[#101828]'>Checkout review</h1>
          <p className='mt-2 text-sm text-[#667085]'>Confirm scope before an order is created.</p>
        </div>

        <div className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-4'>
          <p className='text-xs font-bold uppercase tracking-wide text-[#8a5a18]'>Service</p>
          <h2 className='mt-2 text-xl font-extrabold'>{serviceTitle}</h2>
          <p className='mt-1 text-sm text-[#667085]'>Seller: {sellerName}</p>
        </div>

        {requirements && (
          <div className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-4'>
            <h2 className='font-extrabold'>Seller requirements</h2>
            <p className='mt-2 whitespace-pre-line text-sm leading-6 text-[#667085]'>{requirements}</p>
          </div>
        )}

        <div>
          <Label htmlFor='buyerRequirements'>Your project requirements</Label>
          <Textarea
            id='buyerRequirements'
            value={buyerRequirements}
            onChange={(event) => setBuyerRequirements(event.target.value)}
            className='mt-2 min-h-36 bg-white'
            placeholder='Describe goals, audience, deliverables, references, deadlines, and any files the seller should expect.'
            required
          />
        </div>

        <div>
          <Label htmlFor='scopeConfirmation'>Scope confirmation</Label>
          <Textarea
            id='scopeConfirmation'
            value={scopeConfirmation}
            onChange={(event) => setScopeConfirmation(event.target.value)}
            className='mt-2 min-h-24 bg-white'
            placeholder='Example: I understand this order covers one logo concept with two revisions.'
          />
        </div>

        <label className='flex gap-3 rounded-lg border border-[#eadfce] bg-[#fffdf8] p-4 text-sm'>
          <input
            type='checkbox'
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            className='mt-1 h-4 w-4'
          />
          <span>
            I accept the marketplace terms, confirm the scope above is accurate, and understand beta payments are simulated until a live provider is connected.
          </span>
        </label>
      </section>

      <aside className='h-fit space-y-4 rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
        <div className='flex items-center gap-2'>
          <ShieldCheck className='h-5 w-5 text-[#15803d]' />
          <h2 className='font-extrabold'>Order summary</h2>
        </div>
        <div className='space-y-3 text-sm'>
          <div className='flex justify-between'><span>Service price</span><b>{formatCurrency(price)}</b></div>
          <div className='flex justify-between'><span>Marketplace fee</span><b>{formatCurrency(fee)}</b></div>
          <div className='flex justify-between'><span>Seller earns</span><b>{formatCurrency(sellerEarns)}</b></div>
        </div>
        <div className='rounded-lg bg-white p-4'>
          <h3 className='text-sm font-extrabold'>Payment option</h3>
          <div className='mt-3 grid gap-2'>
            {paymentMethods.map((method) => (
              <label
                key={method.id}
                className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition ${
                  paymentMethod === method.id ? 'border-[#101828] bg-[#f8fafc]' : 'border-[#eadfce] bg-white'
                }`}
              >
                <input
                  type='radio'
                  name='paymentMethod'
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
          <p className='mt-3 text-xs leading-5 text-[#667085]'>
            You can confirm the selected option from the order page after checkout.
          </p>
        </div>
        <div className='rounded-lg bg-white p-4'>
          <h3 className='text-sm font-extrabold'>Cancellation policy</h3>
          <p className='mt-2 text-sm leading-6 text-[#667085]'>{cancellationPolicy}</p>
        </div>
        <div className='rounded-lg bg-white p-4'>
          <h3 className='flex items-center gap-2 text-sm font-extrabold'>
            <CheckCircle2 className='h-4 w-4 text-[#15803d]' />
            After checkout
          </h3>
          <p className='mt-2 text-sm leading-6 text-[#667085]'>The order opens in pending payment, then moves through active work, delivery, revisions, acceptance, and verified review.</p>
        </div>
        <Button className='w-full bg-[#101828] text-white hover:bg-[#1f2937]' disabled={busy}>
          {busy && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          Create order
        </Button>
      </aside>
    </form>
  )
}
