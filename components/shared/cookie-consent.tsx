'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type CookieConsent = {
  necessary: true
  preferences: boolean
  analytics: boolean
  decidedAt: string
}

const storageKey = 'kingdom-cookie-consent'

function saveConsent(consent: Omit<CookieConsent, 'necessary' | 'decidedAt'>) {
  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      necessary: true,
      preferences: consent.preferences,
      analytics: consent.analytics,
      decidedAt: new Date().toISOString(),
    } satisfies CookieConsent)
  )
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [preferences, setPreferences] = useState(true)
  const [analytics, setAnalytics] = useState(false)

  useEffect(() => {
    setVisible(!window.localStorage.getItem(storageKey))
  }, [])

  if (!visible) return null

  const acceptAll = () => {
    saveConsent({ preferences: true, analytics: true })
    setVisible(false)
  }

  const rejectOptional = () => {
    saveConsent({ preferences: false, analytics: false })
    setVisible(false)
  }

  const saveChoices = () => {
    saveConsent({ preferences, analytics })
    setVisible(false)
  }

  return (
    <div className='fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-5 sm:pb-5'>
      <div className='mx-auto max-w-4xl rounded-lg border border-[#eadfce] bg-white p-4 shadow-[0_18px_70px_rgba(16,24,40,0.18)] sm:p-5'>
        <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
          <div className='min-w-0'>
            <p className='text-sm font-extrabold text-[#101828]'>Cookie preferences</p>
            <p className='mt-1 max-w-2xl text-sm leading-6 text-[#667085]'>
              We use necessary cookies to keep the marketplace working. You can also allow preference cookies and analytics cookies.
              Read the <Link href='/privacy' className='font-bold text-[#8a5a18] hover:underline'>privacy policy</Link>.
            </p>
          </div>
          <div className='flex shrink-0 flex-wrap gap-2'>
            <Button type='button' variant='outline' size='sm' onClick={rejectOptional}>
              Reject optional
            </Button>
            <Button type='button' variant='outline' size='sm' onClick={() => setManageOpen((current) => !current)}>
              Options
            </Button>
            <Button type='button' size='sm' className='bg-[#101828] text-white hover:bg-[#1f2937]' onClick={acceptAll}>
              Accept all
            </Button>
          </div>
        </div>

        <div className={cn('mt-4 grid gap-3 border-t border-[#eadfce] pt-4', !manageOpen && 'hidden')}>
          <label className='flex items-start justify-between gap-4 rounded-lg border border-[#eadfce] bg-[#fffdf8] p-3'>
            <span>
              <span className='block text-sm font-bold'>Necessary cookies</span>
              <span className='mt-1 block text-xs leading-5 text-[#667085]'>Required for login, security, checkout, and basic site functions.</span>
            </span>
            <input type='checkbox' checked disabled className='mt-1 h-4 w-4 accent-[#101828]' />
          </label>
          <label className='flex items-start justify-between gap-4 rounded-lg border border-[#eadfce] bg-white p-3'>
            <span>
              <span className='block text-sm font-bold'>Preference cookies</span>
              <span className='mt-1 block text-xs leading-5 text-[#667085]'>Remember interface choices such as consent settings.</span>
            </span>
            <input
              type='checkbox'
              checked={preferences}
              onChange={(event) => setPreferences(event.target.checked)}
              className='mt-1 h-4 w-4 accent-[#101828]'
            />
          </label>
          <label className='flex items-start justify-between gap-4 rounded-lg border border-[#eadfce] bg-white p-3'>
            <span>
              <span className='block text-sm font-bold'>Analytics cookies</span>
              <span className='mt-1 block text-xs leading-5 text-[#667085]'>Help us understand aggregate marketplace usage.</span>
            </span>
            <input
              type='checkbox'
              checked={analytics}
              onChange={(event) => setAnalytics(event.target.checked)}
              className='mt-1 h-4 w-4 accent-[#101828]'
            />
          </label>
          <div className='flex justify-end'>
            <Button type='button' size='sm' className='bg-[#101828] text-white hover:bg-[#1f2937]' onClick={saveChoices}>
              Save choices
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
