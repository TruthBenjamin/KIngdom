'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase-client'
import { useEffect, useState } from 'react'
import { Menu, Search, X } from 'lucide-react'

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
    <header className='sticky top-0 z-50 w-full border-b border-[#eadfce] bg-[#fffdf8]/92 backdrop-blur-xl'>
      <div className='container mx-auto flex h-[72px] items-center justify-between gap-5 px-4 py-3'>
        <Link href='/' className='flex items-center space-x-2'>
          <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-[#101828] font-serif text-lg font-bold text-[#edbd68]'>
            K
          </div>
          <span className='hidden leading-tight sm:inline-block'>
            <span className='block text-sm font-extrabold tracking-[0.12em]'>KINGDOM</span>
            <span className='block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a5a18]'>
              Marketplace
            </span>
          </span>
        </Link>

        <nav className='hidden items-center space-x-8 lg:flex'>
          <Link href='/' className='text-sm font-semibold hover:text-[#a36d1b] transition-colors'>
            Home
          </Link>
          <Link href='/marketplace' className='text-sm font-semibold hover:text-[#a36d1b] transition-colors'>
            Browse
          </Link>
          <Link href='/marketplace' className='text-sm font-semibold hover:text-[#a36d1b] transition-colors'>
            Categories
          </Link>
          <Link href='/how-it-works' className='text-sm font-semibold hover:text-[#a36d1b] transition-colors'>
            How it works
          </Link>
          <Link href='/about' className='text-sm font-semibold hover:text-[#a36d1b] transition-colors'>
            About us
          </Link>
        </nav>

        <div className='hidden min-w-[260px] max-w-md flex-1 items-center gap-2 rounded-lg border border-[#eadfce] bg-white px-3 py-2 xl:flex'>
          <Search className='h-4 w-4 text-[#9aa3af]' />
          <span className='text-xs text-[#9aa3af]'>Search services, skills, or keywords...</span>
        </div>

        <div className='flex items-center gap-2 sm:gap-3'>
          {user ? (
            <div className='hidden items-center gap-3 sm:flex'>
              <Link href={user.user_metadata?.role === 'seller' ? '/dashboard/seller' : '/dashboard/buyer'}>
                <Button variant='ghost' size='sm' className='font-semibold'>
                  Dashboard
                </Button>
              </Link>
              <Button variant='outline' size='sm' onClick={handleSignOut} className='border-[#d8aa5e]'>
                Sign Out
              </Button>
            </div>
          ) : (
            <div className='hidden items-center gap-2 sm:flex'>
              <Link href='/login'>
                <Button variant='ghost' size='sm' className='font-semibold'>
                  Log in
                </Button>
              </Link>
              <Link href='/signup'>
                <Button size='sm' className='bg-[#101828] text-white hover:bg-[#1f2937]'>
                  Sign up
                </Button>
              </Link>
            </div>
          )}
          
          <button
            className='grid h-10 w-10 place-items-center rounded-lg border border-[#eadfce] bg-white lg:hidden'
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label='Toggle navigation menu'
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className='border-t border-[#eadfce] bg-[#fffdf8]'>
          <nav className='container mx-auto flex flex-col gap-3 px-4 py-4'>
            <Link href='/' onClick={() => setMenuOpen(false)} className='text-sm font-semibold hover:text-[#a36d1b] transition-colors'>
              Home
            </Link>
            <Link href='/marketplace' onClick={() => setMenuOpen(false)} className='text-sm font-semibold hover:text-[#a36d1b] transition-colors'>
              Browse
            </Link>
            <Link href='/how-it-works' onClick={() => setMenuOpen(false)} className='text-sm font-semibold hover:text-[#a36d1b] transition-colors'>
              How It Works
            </Link>
            <Link href='/about' onClick={() => setMenuOpen(false)} className='text-sm font-semibold hover:text-[#a36d1b] transition-colors'>
              About us
            </Link>
            <Link href='/contact' onClick={() => setMenuOpen(false)} className='text-sm font-semibold hover:text-[#a36d1b] transition-colors'>
              Contact
            </Link>
            <div className='grid grid-cols-2 gap-2 border-t border-[#eadfce] pt-3 sm:hidden'>
              {user ? (
                <>
                  <Link href={user.user_metadata?.role === 'seller' ? '/dashboard/seller' : '/dashboard/buyer'} onClick={() => setMenuOpen(false)}>
                    <Button variant='outline' size='sm' className='w-full border-[#d8aa5e]'>
                      Dashboard
                    </Button>
                  </Link>
                  <Button variant='outline' size='sm' onClick={handleSignOut} className='w-full border-[#d8aa5e]'>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href='/login' onClick={() => setMenuOpen(false)}>
                    <Button variant='outline' size='sm' className='w-full border-[#d8aa5e]'>
                      Log in
                    </Button>
                  </Link>
                  <Link href='/signup' onClick={() => setMenuOpen(false)}>
                    <Button size='sm' className='w-full bg-[#101828] text-white hover:bg-[#1f2937]'>
                      Sign up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
