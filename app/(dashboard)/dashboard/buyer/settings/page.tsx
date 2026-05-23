'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bell, ShieldCheck, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function BuyerSettingsPage() {
  const [name, setName] = useState('Kingdom Buyer')
  const [email, setEmail] = useState('buyer@example.com')
  const [brief, setBrief] = useState('I usually hire creatives for church media, launch assets, and event support.')
  const [projectAlerts, setProjectAlerts] = useState(true)
  const [messageAlerts, setMessageAlerts] = useState(true)

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault()
    toast.success('Settings saved')
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
              <h1 className='text-3xl font-extrabold text-[#101828] sm:text-4xl'>Buyer settings</h1>
              <p className='mt-2 text-sm text-[#667085]'>Manage your profile, notifications, and marketplace preferences.</p>
            </div>
            <div className='grid h-12 w-12 place-items-center rounded-lg bg-[#101828] text-[#edbd68]'>
              <User className='h-6 w-6' />
            </div>
          </div>

          <form onSubmit={handleSave} className='grid gap-6 lg:grid-cols-[1fr_320px]'>
            <section className='space-y-5 rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
              <div>
                <Label htmlFor='name'>Display name</Label>
                <Input id='name' value={name} onChange={(event) => setName(event.target.value)} className='mt-2 bg-white' />
              </div>
              <div>
                <Label htmlFor='email'>Email</Label>
                <Input id='email' type='email' value={email} onChange={(event) => setEmail(event.target.value)} className='mt-2 bg-white' />
              </div>
              <div>
                <Label htmlFor='brief'>Default project brief</Label>
                <Textarea id='brief' value={brief} onChange={(event) => setBrief(event.target.value)} className='mt-2 min-h-32 bg-white' />
              </div>
              <Button type='submit' className='w-full bg-[#101828] text-white hover:bg-[#1f2937] sm:w-auto'>
                Save changes
              </Button>
            </section>

            <aside className='space-y-4'>
              <div className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
                <div className='mb-4 flex items-center gap-2'>
                  <Bell className='h-5 w-5 text-[#b97822]' />
                  <h2 className='font-extrabold'>Notifications</h2>
                </div>
                <label className='mb-3 flex items-center justify-between gap-4 text-sm font-semibold'>
                  Project updates
                  <input
                    type='checkbox'
                    checked={projectAlerts}
                    onChange={(event) => setProjectAlerts(event.target.checked)}
                    className='h-4 w-4 rounded border-[#d8c9b5]'
                  />
                </label>
                <label className='flex items-center justify-between gap-4 text-sm font-semibold'>
                  New messages
                  <input
                    type='checkbox'
                    checked={messageAlerts}
                    onChange={(event) => setMessageAlerts(event.target.checked)}
                    className='h-4 w-4 rounded border-[#d8c9b5]'
                  />
                </label>
              </div>
              <div className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
                <div className='mb-3 flex items-center gap-2'>
                  <ShieldCheck className='h-5 w-5 text-[#15803d]' />
                  <h2 className='font-extrabold'>Account health</h2>
                </div>
                <p className='text-sm leading-6 text-[#667085]'>Your profile is ready to message creators, save services, and track future orders.</p>
              </div>
            </aside>
          </form>
        </div>
      </div>
    </div>
  )
}
