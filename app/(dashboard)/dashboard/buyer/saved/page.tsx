'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Heart, Loader2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/hooks/use-current-user'
import { formatCurrency } from '@/lib/utils'

type SavedService = {
  id: string
  title: string
  slug: string | null
  price: number
  category: string
  seller?: { full_name: string | null } | null
}

export default function SavedServicesPage() {
  const router = useRouter()
  const { user, loading, supabase } = useCurrentUser()
  const [services, setServices] = useState<SavedService[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  const loadSaved = useCallback(async () => {
    if (!user) return
    setDataLoading(true)

    const { data, error } = await supabase
      .from('saved_services')
      .select('service:services(id, title, slug, price, category, seller:users!services_seller_id_fkey(full_name))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Could not load saved services')
      setDataLoading(false)
      return
    }

    setServices(
      ((data || []) as unknown as { service: SavedService | SavedService[] | null }[])
        .map((row) => (Array.isArray(row.service) ? row.service[0] : row.service))
        .filter((service): service is SavedService => Boolean(service))
    )
    setDataLoading(false)
  }, [supabase, user])

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, router, user])

  useEffect(() => {
    void loadSaved()
  }, [loadSaved])

  const removeSaved = async (serviceId: string) => {
    if (!user) return
    setServices((current) => current.filter((service) => service.id !== serviceId))
    const { error } = await supabase.from('saved_services').delete().eq('user_id', user.id).eq('service_id', serviceId)
    if (error) {
      toast.error('Could not remove saved service')
      void loadSaved()
      return
    }
    toast.success('Removed from saved')
  }

  if (loading || !user) {
    return (
      <div className='grid min-h-screen place-items-center'>
        <Loader2 className='h-8 w-8 animate-spin text-[#b97822]' />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#f7f3ec] px-3 py-4 sm:px-6 sm:py-8'>
      <div className='mx-auto max-w-5xl'>
        <Link href='/dashboard/buyer' className='mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#8a5a18]'>
          <ArrowLeft className='h-4 w-4' />
          Buyer dashboard
        </Link>

        <div className='rounded-lg border border-[#eadfce] bg-white p-5 sm:p-8'>
          <div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
            <div>
              <h1 className='text-3xl font-extrabold'>Saved services</h1>
              <p className='mt-1 text-sm text-[#667085]'>Persistent saved listings from your Supabase account.</p>
            </div>
            <Link href='/marketplace'>
              <Button className='bg-[#101828] text-white hover:bg-[#1f2937]'>Browse marketplace</Button>
            </Link>
          </div>

          {dataLoading ? (
            <div className='grid min-h-64 place-items-center'>
              <Loader2 className='h-7 w-7 animate-spin text-[#b97822]' />
            </div>
          ) : services.length ? (
            <div className='space-y-3'>
              {services.map((service) => (
                <div key={service.id} className='flex flex-col gap-3 rounded-lg border border-[#eadfce] bg-[#fffdf8] p-4 sm:flex-row sm:items-center sm:justify-between'>
                  <Link href={`/listing/${service.slug || service.id}`} className='min-w-0'>
                    <p className='truncate font-extrabold'>{service.title}</p>
                    <p className='mt-1 text-sm text-[#667085]'>
                      {service.category} by {service.seller?.full_name || 'Kingdom seller'} · {formatCurrency(service.price)}
                    </p>
                  </Link>
                  <Button variant='outline' size='sm' className='border-[#eadfce] bg-white' onClick={() => removeSaved(service.id)}>
                    <Trash2 className='mr-2 h-4 w-4' />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className='grid min-h-64 place-items-center rounded-lg border border-dashed border-[#d8c9b5] bg-[#fffdf8] p-8 text-center'>
              <div>
                <Heart className='mx-auto h-10 w-10 text-[#b97822]' />
                <h2 className='mt-4 text-xl font-extrabold'>No saved services yet</h2>
                <p className='mt-2 text-sm text-[#667085]'>Use the save button on any listing to build your shortlist.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
