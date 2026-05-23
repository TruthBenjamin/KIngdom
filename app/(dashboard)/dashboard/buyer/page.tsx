'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase-client'
import { CreditCard, Heart, MessageCircle, Settings } from 'lucide-react'
import Link from 'next/link'

export default function BuyerDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
      }
      setLoading(false)
    }

    checkAuth()
  }, [supabase, router])

  if (loading) {
    return <div className='min-h-screen flex items-center justify-center'>Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className='min-h-screen py-12'>
      <div className='container mx-auto px-4'>
        <div className='mb-8'>
          <h1 className='text-4xl font-bold mb-2'>My Dashboard</h1>
          <p className='text-muted-foreground'>Manage your projects and communications</p>
        </div>

        {/* Quick Stats */}
        <div className='grid md:grid-cols-4 gap-6 mb-8'>
          {[
            { label: 'Saved Creators', value: '5', color: 'bg-blue-500' },
            { label: 'Active Chats', value: '3', color: 'bg-green-500' },
            { label: 'Completed Projects', value: '12', color: 'bg-purple-500' },
            { label: 'Total Spent', value: '$8,450', color: 'bg-orange-500' },
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className='p-6'>
                <div className={`h-3 w-3 rounded-full ${stat.color} mb-3`} />
                <p className='text-muted-foreground text-sm'>{stat.label}</p>
                <p className='text-2xl font-bold'>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Actions */}
        <div className='grid md:grid-cols-4 gap-6 mb-8'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Heart className='h-5 w-5' />
                Saved Creators
              </CardTitle>
              <CardDescription>View creators you&apos;ve bookmarked</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className='w-full'>View Saved</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <MessageCircle className='h-5 w-5' />
                Conversations
              </CardTitle>
              <CardDescription>Chat with your creators</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href='/dashboard/messages'>
                <Button className='w-full'>View Chats</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Settings className='h-5 w-5' />
                Settings
              </CardTitle>
              <CardDescription>Update your preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href='/dashboard/buyer/settings'>
                <Button className='w-full'>Settings</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <CreditCard className='h-5 w-5' />
                Payments
              </CardTitle>
              <CardDescription>Track escrow orders and wallet activity</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href='/dashboard/payments'>
                <Button className='w-full'>View Payments</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Browse More */}
        <Card>
          <CardHeader>
            <CardTitle>Discover More Creators</CardTitle>
            <CardDescription>Continue exploring our marketplace</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href='/marketplace'>
              <Button className='w-full'>Browse Marketplace</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
