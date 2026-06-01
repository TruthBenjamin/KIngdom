'use client'

import { useState } from 'react'
import { Mail, MessageCircle, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const reasons = ['Account help', 'Seller review', 'Order or payment', 'Report abuse', 'General question']

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState(reasons[0])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    const subject = encodeURIComponent(`[${reason}] Kingdom Marketplace message from ${name}`)
    const body = encodeURIComponent(`${message}\n\nName: ${name}\nEmail: ${email}\nReason: ${reason}`)
    window.location.href = `mailto:support@kingdommarketplace.com?subject=${subject}&body=${body}`
    toast.success('Opening your email app.')
    setLoading(false)
  }

  return (
    <div className='bg-white px-4 py-8 sm:px-6 sm:py-12'>
      <div className='mx-auto grid max-w-5xl gap-5 lg:grid-cols-[0.85fr_1.15fr]'>
        <section className='rounded-lg border border-[#eadfce] bg-white p-6 shadow-[0_18px_60px_rgba(33,24,10,0.08)] sm:p-8'>
          <h1 className='text-4xl font-extrabold leading-tight text-[#101828]'>We can help with marketplace questions.</h1>
          <div className='mt-6 grid gap-3'>
            {[
              [Mail, 'General support', 'Questions about accounts, listings, or platform access.'],
              [ShieldCheck, 'Trust and safety', 'Seller review, service moderation, reports, or disputes.'],
              [MessageCircle, 'Buyer and seller workflows', 'Help with messaging, hiring, delivery, or reviews.'],
            ].map(([Icon, title, body]) => (
              <div key={title as string} className='rounded-lg bg-[#fffdf8] p-4'>
                <Icon className='h-5 w-5 text-[#8a5a18]' />
                <h2 className='mt-3 font-extrabold'>{title as string}</h2>
                <p className='mt-1 text-sm leading-6 text-[#667085]'>{body as string}</p>
              </div>
            ))}
          </div>
        </section>

        <form onSubmit={handleSubmit} className='rounded-lg border border-[#eadfce] bg-white p-6 shadow-[0_18px_60px_rgba(33,24,10,0.08)] sm:p-8'>
          <div className='grid gap-4'>
            <div>
              <Label htmlFor='name'>Name</Label>
              <Input id='name' value={name} onChange={(event) => setName(event.target.value)} required className='mt-2' />
            </div>
            <div>
              <Label htmlFor='email'>Email</Label>
              <Input id='email' type='email' value={email} onChange={(event) => setEmail(event.target.value)} required className='mt-2' />
            </div>
            <div>
              <Label htmlFor='reason'>Reason</Label>
              <select id='reason' value={reason} onChange={(event) => setReason(event.target.value)} className='mt-2 h-10 w-full rounded-lg border border-[#eadfce] bg-white px-3 text-sm'>
                {reasons.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor='message'>Message</Label>
              <Textarea id='message' value={message} onChange={(event) => setMessage(event.target.value)} required className='mt-2 min-h-36' />
            </div>
            <Button type='submit' className='w-full bg-[#101828] text-white hover:bg-[#1f2937]' disabled={loading}>
              {loading ? 'Opening email app' : 'Open email draft'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
