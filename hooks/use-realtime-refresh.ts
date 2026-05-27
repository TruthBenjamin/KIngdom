'use client'

import { useEffect } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

type RealtimeWatch = {
  table: string
  filter?: string
}

export function useRealtimeRefresh(
  supabase: SupabaseClient<Database>,
  channelName: string | null,
  watches: RealtimeWatch[],
  refresh: () => void | Promise<void>
) {
  useEffect(() => {
    if (!channelName || !watches.length) return

    const channel = supabase.channel(channelName)

    watches.forEach((watch) => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: watch.table,
          filter: watch.filter,
        },
        () => {
          void refresh()
        }
      )
    })

    channel.subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [channelName, refresh, supabase, watches])
}
