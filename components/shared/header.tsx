'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase-client'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

export function Header() {
  const [user, setUser] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  return (
    <header className='sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container mx-auto flex h-16 items-center justify-between px-4'>
        <Link href='/' className='flex items-center space-x-2'>
          <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold'>
            K
          </div>
          <span className='hidden font-semibold sm:inline-block text-lg'>
            Kingdom
          </span>
        </Link>

        <nav className='hidden md:flex items-center space-x-8'>
          <Link href='/marketplace' className='text-sm font-medium hover:text-primary transition-colors'>
            Marketplace
          </Link>
          <Link href='/how-it-works' className='text-sm font-medium hover:text-primary transition-colors'>
            How It Works
          </Link>
        </nav>

        <div className='flex items-center space-x-4'>
          {user ? (
            <>
              <Link href={user.user_metadata?.role === 'seller' ? '/dashboard/seller' : '/dashboard/buyer'}>
                <Button variant='ghost' size='sm'>
                  Dashboard
                </Button>
              </Link>
              <Button variant='outline' size='sm' onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href='/login'>
                <Button variant='ghost' size='sm'>
                  Sign In
                </Button>
              </Link>
              <Link href='/signup'>
                <Button size='sm'>
                  Get Started
                </Button>
              </Link>
            </>
          )}
          
          <button
            className='md:hidden'
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className='border-t border-border bg-background'>
          <nav className='container mx-auto flex flex-col space-y-3 px-4 py-4'>
            <Link href='/marketplace' className='text-sm font-medium hover:text-primary transition-colors'>
              Marketplace
            </Link>
            <Link href='/how-it-works' className='text-sm font-medium hover:text-primary transition-colors'>
              How It Works
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
