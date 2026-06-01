'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MarketplaceError() {
  return (
    <div className='grid min-h-[70vh] place-items-center bg-white px-4 text-center'>
      <div>
        <AlertTriangle className='mx-auto h-10 w-10 text-[#b97822]' />
        <h1 className='mt-4 text-2xl font-extrabold'>Marketplace could not load</h1>
        <p className='mt-2 max-w-md text-sm leading-6 text-[#667085]'>
          The catalog is temporarily unavailable. Try again or return to the homepage.
        </p>
        <Link href='/'>
          <Button className='mt-5 bg-[#101828] text-white hover:bg-[#1f2937]'>Go home</Button>
        </Link>
      </div>
    </div>
  )
}
