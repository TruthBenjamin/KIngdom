'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase-client'
import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Menu, Search, X } from 'lucide-react'
import { dashboardPathForRole, getSessionUser, AppSessionUser } from '@/lib/auth/session'
import { NotificationCenter } from '@/components/shared/notification-center'

export function Header() {
  const [user, setUser] = useState<AppSessionUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  useEffect(() => {
    getSessionUser(supabase).then((sessionUser) => {
      setUser(sessionUser)
    })
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  return (
    <header className='sticky top-0 z-50 w-full border-b border-[#efe7dc] bg-white/95 backdrop-blur-xl'>
      <div className='mx-auto flex h-[64px] max-w-[1510px] items-center justify-between gap-5 px-4 py-3 sm:px-6'>
        <Link href='/' className='flex items-center space-x-2'>
          <div className='flex h-9 w-9 items-center justify-center rounded-md border border-[#d7aa5a] bg-[#fff8eb] font-serif text-lg font-extrabold text-[#bd7b25]'>
            KM
          </div>
          <span className='hidden leading-tight sm:inline-block'>
            <span className='block text-sm font-extrabold tracking-[0.13em] text-[#101828]'>KINGDOM</span>
            <span className='block text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#667085]'>
              Marketplace
            </span>
          </span>
        </Link>

        <Link href='/marketplace' className='hidden h-10 min-w-[280px] max-w-[470px] flex-1 items-center gap-3 rounded-md border border-[#efe7dc] bg-white px-4 transition hover:border-[#d8aa5e] md:flex'>
          <span className='min-w-0 flex-1 truncate text-xs text-[#98a2b3]'>What service are you looking for today?</span>
          <Search className='h-4 w-4 text-[#9aa3af]' />
        </Link>

        <nav className='hidden items-center gap-8 lg:flex'>
          <Link href='/marketplace' className='text-sm font-bold text-[#344054] transition-colors hover:text-[#a36d1b]'>
            Explore
          </Link>
          <Link href='/marketplace' className='inline-flex items-center gap-1 text-sm font-bold text-[#344054] transition-colors hover:text-[#a36d1b]'>
            Categories
            <ChevronDown className='h-3.5 w-3.5' />
          </Link>
          <Link href='/signup' className='text-sm font-bold text-[#344054] transition-colors hover:text-[#a36d1b]'>
            Become a Seller
          </Link>
          <Link href='/how-it-works' className='inline-flex items-center gap-1 text-sm font-bold text-[#344054] transition-colors hover:text-[#a36d1b]'>
            Resources
            <ChevronDown className='h-3.5 w-3.5' />
          </Link>
        </nav>

        <div className='flex items-center gap-2 sm:gap-3'>
          {user && <NotificationCenter />}
          {user ? (
            <div className='hidden items-center gap-3 sm:flex'>
              <Link href={dashboardPathForRole(user.role)}>
                <Button variant='ghost' size='sm' className='font-bold'>
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
                <Button variant='ghost' size='sm' className='font-bold'>
                  Log in
                </Button>
              </Link>
              <Link href='/signup'>
                <Button size='sm' className='rounded-md bg-[#101828] px-5 text-white hover:bg-[#1f2937]'>
                  Join
                </Button>
              </Link>
            </div>
          )}
          
          <button
            className='grid h-10 w-10 place-items-center rounded-md border border-[#efe7dc] bg-white lg:hidden'
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label='Toggle navigation menu'
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className='border-t border-[#efe7dc] bg-white'>
          <nav className='mx-auto flex max-w-[1510px] flex-col gap-3 px-4 py-4 sm:px-6'>
            <Link href='/marketplace' onClick={() => setMenuOpen(false)} className='text-sm font-semibold transition-colors hover:text-[#a36d1b]'>
              Explore
            </Link>
            <Link href='/marketplace/brand-design' onClick={() => setMenuOpen(false)} className='text-sm font-semibold transition-colors hover:text-[#a36d1b]'>
              Categories
            </Link>
            <Link href='/signup' onClick={() => setMenuOpen(false)} className='text-sm font-semibold transition-colors hover:text-[#a36d1b]'>
              Become a Seller
            </Link>
            <Link href='/how-it-works' onClick={() => setMenuOpen(false)} className='text-sm font-semibold transition-colors hover:text-[#a36d1b]'>
              Resources
            </Link>
            <div className='grid grid-cols-2 gap-2 border-t border-[#efe7dc] pt-3 sm:hidden'>
              {user ? (
                <>
                  <Link href={dashboardPathForRole(user.role)} onClick={() => setMenuOpen(false)}>
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
                      Join
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
