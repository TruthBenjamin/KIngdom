import { Skeleton } from '@/components/ui/skeleton'

export default function MarketplaceLoading() {
  return (
    <div className='min-h-screen bg-white px-3 py-3'>
      <div className='mx-auto grid max-w-[1500px] gap-0 lg:grid-cols-[250px_1fr] xl:grid-cols-[250px_1fr_330px]'>
        <aside className='hidden border-r border-[#eadfce] bg-[#fffdf8] p-6 lg:block'>
          <Skeleton className='mb-5 h-4 w-24' />
          <div className='space-y-2'>
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className='h-9 w-full' />
            ))}
          </div>
        </aside>
        <main className='bg-white p-5 sm:p-8'>
          <div className='mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between'>
            <div>
              <Skeleton className='h-8 w-72 max-w-full' />
              <Skeleton className='mt-3 h-4 w-96 max-w-full' />
            </div>
            <Skeleton className='h-11 w-full xl:w-96' />
          </div>
          <div className='mb-6 flex flex-wrap gap-2'>
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className='h-9 w-24' />
            ))}
          </div>
          <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className='overflow-hidden rounded-lg border border-[#eadfce] bg-[#fffdf8]'>
                <Skeleton className='aspect-[1.05] rounded-none' />
                <div className='space-y-3 p-4'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-5 w-full' />
                  <Skeleton className='h-5 w-4/5' />
                  <div className='flex justify-between gap-3'>
                    <Skeleton className='h-4 w-20' />
                    <Skeleton className='h-4 w-16' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
        <aside className='hidden border-l border-[#eadfce] bg-[#fffdf8] p-6 xl:block'>
          <Skeleton className='h-56 w-full' />
        </aside>
      </div>
    </div>
  )
}
