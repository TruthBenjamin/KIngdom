import { redirect } from 'next/navigation'
import { createPublicServerClient } from '@/lib/supabase-public'

export const dynamic = 'force-dynamic'

type PublicProfileRouteProps = {
  params: Promise<{ slug: string }>
}

export default async function PublicProfileSlugPage({ params }: PublicProfileRouteProps) {
  const { slug: rawSlug } = await params
  const supabase = createPublicServerClient()
  const slug = decodeURIComponent(rawSlug || '').trim().toLowerCase()

  if (!slug) redirect('/marketplace')

  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('username', slug)
    .in('role', ['seller', 'admin'])
    .maybeSingle()

  if (!data?.id) redirect('/marketplace')

  redirect(`/profile/${data.id}`)
}
