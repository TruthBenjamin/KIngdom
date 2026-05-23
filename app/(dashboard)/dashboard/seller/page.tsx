'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase-client'
import { MessageCircle, FileText, Settings } from 'lucide-react'
import Link from 'next/link'

export default function SellerDashboard() {
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
          <h1 className='text-4xl font-bold mb-2'>Seller Dashboard</h1>
          <p className='text-muted-foreground'>Manage your services and communications</p>
        </div>

        {/* Quick Stats */}
        <div className='grid md:grid-cols-4 gap-6 mb-8'>
          {[
            { label: 'Active Listings', value: '3', color: 'bg-blue-500' },
            { label: 'Messages', value: '12', color: 'bg-green-500' },
            { label: 'Rating', value: '4.9', color: 'bg-yellow-500' },
            { label: 'Total Earnings', value: '$15,240', color: 'bg-purple-500' },
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
        <div className='grid md:grid-cols-3 gap-6 mb-8'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <FileText className='h-5 w-5' />
                Listings
              </CardTitle>
              <CardDescription>Create and manage your service listings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className='w-full'>Manage Listings</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <MessageCircle className='h-5 w-5' />
                Messages
              </CardTitle>
              <CardDescription>Communicate with potential clients</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className='w-full'>View Messages</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Settings className='h-5 w-5' />
                Profile
              </CardTitle>
              <CardDescription>Update your profile and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href='/dashboard/seller/profile'>
                <Button className='w-full'>Edit Profile</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
            <CardDescription>Latest communications from clients</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground text-center py-8'>No messages yet</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
