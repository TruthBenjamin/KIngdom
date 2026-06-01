import { Skeleton } from '@/components/ui/skeleton'

export default function BuyerDashboardLoading() {
  return (
    <div className='min-h-screen bg-white py-8 sm:py-12'>
      <div className='container mx-auto px-4'>
        <div className='mb-8 flex items-end justify-between gap-4'>
          <div>
            <Skeleton className='h-10 w-72' />
            <Skeleton className='mt-3 h-4 w-96 max-w-full' />
          </div>
          <Skeleton className='hidden h-10 w-36 sm:block' />
        </div>
        <div className='mb-8 grid gap-6 md:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className='h-32 w-full' />
          ))}
        </div>
        <div className='grid gap-6 lg:grid-cols-[1fr_0.8fr]'>
          <Skeleton className='h-80 w-full' />
          <Skeleton className='h-80 w-full' />
        </div>
      </div>
    </div>
  )
}
