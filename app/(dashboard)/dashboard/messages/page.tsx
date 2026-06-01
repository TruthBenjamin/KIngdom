import { Suspense } from 'react'
import RealtimeMessenger from '@/components/messaging/realtime-messenger'
import { Skeleton } from '@/components/ui/skeleton'

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-white px-3 py-3 sm:px-5 sm:py-5'>
          <div className='mx-auto grid max-w-[1500px] gap-0 overflow-hidden rounded-lg border border-[#e6d9c8] bg-white lg:grid-cols-[380px_1fr]'>
            <div className='hidden border-r border-[#eadfce] bg-[#fffdf8] p-5 lg:block'>
              <Skeleton className='h-8 w-40' />
              <Skeleton className='mt-5 h-11 w-full' />
              <div className='mt-5 space-y-3'>
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className='h-20 w-full' />
                ))}
              </div>
            </div>
            <Skeleton className='min-h-[70vh] rounded-none' />
          </div>
        </div>
      }
    >
      <RealtimeMessenger />
    </Suspense>
  )
}
