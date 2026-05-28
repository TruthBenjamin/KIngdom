import { Skeleton } from '@/components/ui/skeleton'

export default function SellerDashboardLoading() {
  return (
    <div className='min-h-screen bg-[#f7f3ec] px-3 py-3'>
      <div className='mx-auto grid max-w-[1320px] gap-3 lg:grid-cols-[250px_1fr]'>
        <aside className='hidden min-h-[calc(100vh-96px)] rounded-lg bg-[#101828] p-5 lg:block'>
          <Skeleton className='mb-9 h-10 w-36 bg-white/15' />
          <div className='space-y-2'>
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className='h-10 w-full bg-white/10' />
            ))}
          </div>
        </aside>
        <main className='rounded-lg bg-white p-5 sm:p-8'>
          <div className='mb-8 flex justify-between gap-4'>
            <div>
              <Skeleton className='h-9 w-72' />
              <Skeleton className='mt-3 h-4 w-96 max-w-full' />
            </div>
            <Skeleton className='h-10 w-24' />
          </div>
          <div className='mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className='h-32 w-full' />
            ))}
          </div>
          <div className='grid gap-5 xl:grid-cols-[0.9fr_1.1fr]'>
            <Skeleton className='h-96 w-full' />
            <Skeleton className='h-96 w-full' />
          </div>
        </main>
      </div>
    </div>
  )
}
