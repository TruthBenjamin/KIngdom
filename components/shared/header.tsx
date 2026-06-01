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
    <header className='sticky top-0 z-50 w-full border-b border-[#17365c] bg-[#06172f] text-white shadow-[0_12px_35px_rgba(6,23,47,0.22)] backdrop-blur-xl'>
      <div className='mx-auto flex min-h-[64px] max-w-[1510px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:gap-5'>
        <Link href='/' className='flex shrink-0 items-center space-x-2'>
          <div className='flex h-9 w-9 items-center justify-center rounded-md border border-[#f0c56a] bg-[#0b2442] font-serif text-lg font-extrabold text-[#f0c56a]'>
            KM
          </div>
          <span className='hidden leading-tight sm:inline-block'>
            <span className='block text-sm font-extrabold tracking-[0.13em] text-white'>KINGDOM</span>
            <span className='block text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/62'>
              Marketplace
            </span>
          </span>
        </Link>

        <Link href='/marketplace' className='hidden h-10 min-w-[220px] max-w-[470px] flex-1 items-center gap-3 rounded-md border border-white/20 bg-white/10 px-4 transition hover:border-[#f0c56a] hover:bg-white/15 md:flex'>
          <span className='min-w-0 flex-1 truncate text-xs font-semibold text-white/74'>What service are you looking for today?</span>
          <Search className='h-4 w-4 text-white/70' />
        </Link>

        <nav className='hidden items-center gap-5 xl:gap-7 lg:flex'>
          <Link href='/marketplace' className='whitespace-nowrap text-sm font-bold text-white/85 transition-colors hover:text-[#f0c56a]'>
            Explore
          </Link>
          <Link href='/marketplace' className='inline-flex items-center gap-1 whitespace-nowrap text-sm font-bold text-white/85 transition-colors hover:text-[#f0c56a]'>
            Categories
            <ChevronDown className='h-3.5 w-3.5' />
          </Link>
          <Link href='/signup' className='whitespace-nowrap text-sm font-bold text-white/85 transition-colors hover:text-[#f0c56a]'>
            Become a Seller
          </Link>
          <Link href='/how-it-works' className='inline-flex items-center gap-1 whitespace-nowrap text-sm font-bold text-white/85 transition-colors hover:text-[#f0c56a]'>
            Resources
            <ChevronDown className='h-3.5 w-3.5' />
          </Link>
        </nav>

        <div className='flex items-center gap-2 sm:gap-3'>
          {user && <NotificationCenter />}
          {user ? (
            <div className='hidden items-center gap-3 sm:flex'>
              <Link href={dashboardPathForRole(user.role)}>
                <Button variant='ghost' size='sm' className='font-bold text-white hover:bg-white/10 hover:text-white'>
                  Dashboard
                </Button>
              </Link>
              <Link href='/dashboard/profile'>
                <Button variant='ghost' size='sm' className='font-bold text-white hover:bg-white/10 hover:text-white'>
                  Profile
                </Button>
              </Link>
              <Button variant='outline' size='sm' onClick={handleSignOut} className='border-white/25 bg-white text-[#06172f] hover:bg-[#f8fafc] hover:text-[#06172f]'>
                Sign Out
              </Button>
            </div>
          ) : (
            <div className='hidden items-center gap-2 sm:flex'>
              <Link href='/login'>
                <Button variant='ghost' size='sm' className='font-bold text-white hover:bg-white/10 hover:text-white'>
                  Log in
                </Button>
              </Link>
              <Link href='/signup'>
                <Button size='sm' className='rounded-md bg-[#f0c56a] px-5 font-extrabold text-[#06172f] shadow-[0_0_0_1px_rgba(240,197,106,0.2)] hover:bg-[#f6d68a] hover:text-[#06172f]'>
                  Join
                </Button>
              </Link>
            </div>
          )}
          
          <button
            className='grid h-10 w-10 place-items-center rounded-md border border-white/20 bg-white/10 text-white lg:hidden'
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label='Toggle navigation menu'
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className='max-h-[calc(100dvh-64px)] overflow-y-auto border-t border-white/10 bg-[#06172f]'>
          <nav className='mx-auto flex max-w-[1510px] flex-col gap-2 px-4 py-4 sm:px-6'>
            <Link href='/marketplace' onClick={() => setMenuOpen(false)} className='flex min-h-11 items-center rounded-md px-2 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10 hover:text-[#f0c56a]'>
              <Search className='mr-2 h-4 w-4 text-white/70' />
              Search marketplace
            </Link>
            <Link href='/marketplace' onClick={() => setMenuOpen(false)} className='flex min-h-11 items-center rounded-md px-2 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10 hover:text-[#f0c56a]'>
              Explore
            </Link>
            <Link href='/marketplace/brand-design' onClick={() => setMenuOpen(false)} className='flex min-h-11 items-center rounded-md px-2 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10 hover:text-[#f0c56a]'>
              Categories
            </Link>
            <Link href='/signup' onClick={() => setMenuOpen(false)} className='flex min-h-11 items-center rounded-md px-2 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10 hover:text-[#f0c56a]'>
              Become a Seller
            </Link>
            <Link href='/how-it-works' onClick={() => setMenuOpen(false)} className='flex min-h-11 items-center rounded-md px-2 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10 hover:text-[#f0c56a]'>
              Resources
            </Link>
            <div className='grid gap-2 border-t border-white/10 pt-3 sm:hidden'>
              {user ? (
                <>
                  <Link href={dashboardPathForRole(user.role)} onClick={() => setMenuOpen(false)}>
                    <Button variant='outline' size='sm' className='w-full border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white'>
                      Dashboard
                    </Button>
                  </Link>
                  <Link href='/dashboard/profile' onClick={() => setMenuOpen(false)}>
                    <Button variant='outline' size='sm' className='w-full border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white'>
                      Profile
                    </Button>
                  </Link>
                  <Button variant='outline' size='sm' onClick={handleSignOut} className='w-full border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white'>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href='/login' onClick={() => setMenuOpen(false)}>
                    <Button variant='outline' size='sm' className='w-full border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white'>
                      Log in
                    </Button>
                  </Link>
                  <Link href='/signup' onClick={() => setMenuOpen(false)}>
                    <Button size='sm' className='w-full bg-[#f0c56a] font-extrabold text-[#06172f] hover:bg-[#f6d68a] hover:text-[#06172f]'>
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
