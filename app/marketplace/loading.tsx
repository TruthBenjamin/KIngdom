import { Loader2 } from 'lucide-react'

export default function MarketplaceLoading() {
  return (
    <div className='grid min-h-[70vh] place-items-center bg-[#f7f3ec]'>
      <div className='text-center'>
        <Loader2 className='mx-auto h-8 w-8 animate-spin text-[#b97822]' />
        <p className='mt-3 text-sm font-semibold text-[#667085]'>Loading marketplace services...</p>
      </div>
    </div>
  )
}
