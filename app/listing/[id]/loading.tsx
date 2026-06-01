import { Loader2 } from 'lucide-react'

export default function ListingLoading() {
  return (
    <div className='grid min-h-[70vh] place-items-center bg-white'>
      <Loader2 className='h-8 w-8 animate-spin text-[#b97822]' />
    </div>
  )
}
