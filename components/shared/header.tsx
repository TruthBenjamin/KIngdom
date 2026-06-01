'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase-client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, LayoutDashboard, LogOut, Menu, Search, Settings, X } from 'lucide-react'
import { dashboardPathForRole, getSessionUser, AppSessionUser } from '@/lib/auth/session'
import { NotificationCenter } from '@/components/shared/notification-center'
import { Avatar } from '@/components/ui/avatar'

const categoryLinks = [
  ['Brand Design', '/marketplace/brand-design'],
  ['Video Production', '/marketplace/video-production'],
  ['Worship Audio', '/marketplace/worship-audio'],
  ['Web Development', '/marketplace/web-development'],
  ['Writing Strategy', '/marketplace/writing-strategy'],
  ['Event Support', '/marketplace/event-support'],
] as const

const resourceLinks = [
  ['How it works', '/how-it-works'],
  ['About Kingdom Marketplace', '/about'],
  ['Contact support', '/contact'],
  ['Terms of service', '/terms'],
  ['Privacy policy', '/privacy'],
] as const

function initialsFor(user: AppSessionUser | null) {
  const name = user?.fullName || user?.email || 'User'
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U'
}

export function Header() {
  const [user, setUser] = useState<AppSessionUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const profileRef = useRef<HTMLDivElement | null>(null)
  const navRef = useRef<HTMLElement | null>(null)

  const refreshUser = useCallback(async () => {
    const sessionUser = await getSessionUser(supabase)
    setUser(sessionUser)
  }, [supabase])

  useEffect(() => {
    void refreshUser()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshUser()
    })

    return () => subscription.unsubscribe()
  }, [refreshUser, supabase.auth])

  useEffect(() => {
    if (!profileOpen && !categoriesOpen && !resourcesOpen) return

    const closeMenus = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setCategoriesOpen(false)
        setResourcesOpen(false)
      }
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileOpen(false)
        setCategoriesOpen(false)
        setResourcesOpen(false)
      }
    }

    window.addEventListener('mousedown', closeMenus)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('mousedown', closeMenus)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [categoriesOpen, profileOpen, resourcesOpen])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfileOpen(false)
    setMenuOpen(false)
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

        <nav ref={navRef} className='hidden items-center gap-5 xl:gap-7 lg:flex'>
          <Link href='/marketplace' className='whitespace-nowrap text-sm font-bold text-white/85 transition-colors hover:text-[#f0c56a]'>
            Explore
          </Link>
          <div className='relative'>
            <button
              type='button'
              onClick={() => {
                setCategoriesOpen((current) => !current)
                setResourcesOpen(false)
              }}
              className='inline-flex items-center gap-1 whitespace-nowrap text-sm font-bold text-white/85 transition-colors hover:text-[#f0c56a]'
              aria-expanded={categoriesOpen}
            >
              Categories
              <ChevronDown className={`h-3.5 w-3.5 transition ${categoriesOpen ? 'rotate-180' : ''}`} />
            </button>
            {categoriesOpen && (
              <div className='absolute left-0 top-8 z-[95] w-[250px] overflow-hidden rounded-lg border border-[#d8c9b5] bg-white p-2 text-[#101828] shadow-[0_22px_70px_rgba(0,0,0,0.28)]'>
                <Link href='/marketplace' onClick={() => setCategoriesOpen(false)} className='block rounded-md px-3 py-2 text-sm font-extrabold hover:bg-[#fff3dc]'>
                  All categories
                </Link>
                {categoryLinks.map(([label, href]) => (
                  <Link key={href} href={href} onClick={() => setCategoriesOpen(false)} className='block rounded-md px-3 py-2 text-sm font-bold text-[#344054] hover:bg-[#fff3dc] hover:text-[#8a5a18]'>
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link href='/signup' className='whitespace-nowrap text-sm font-bold text-white/85 transition-colors hover:text-[#f0c56a]'>
            Become a Seller
          </Link>
          <div className='relative'>
            <button
              type='button'
              onClick={() => {
                setResourcesOpen((current) => !current)
                setCategoriesOpen(false)
              }}
              className='inline-flex items-center gap-1 whitespace-nowrap text-sm font-bold text-white/85 transition-colors hover:text-[#f0c56a]'
              aria-expanded={resourcesOpen}
            >
              Resources
              <ChevronDown className={`h-3.5 w-3.5 transition ${resourcesOpen ? 'rotate-180' : ''}`} />
            </button>
            {resourcesOpen && (
              <div className='absolute right-0 top-8 z-[95] w-[250px] overflow-hidden rounded-lg border border-[#d8c9b5] bg-white p-2 text-[#101828] shadow-[0_22px_70px_rgba(0,0,0,0.28)]'>
                {resourceLinks.map(([label, href]) => (
                  <Link key={href} href={href} onClick={() => setResourcesOpen(false)} className='block rounded-md px-3 py-2 text-sm font-bold text-[#344054] hover:bg-[#fff3dc] hover:text-[#8a5a18]'>
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className='flex items-center gap-2 sm:gap-3'>
          {user && <NotificationCenter />}
          {user ? (
            <div ref={profileRef} className='relative hidden sm:block'>
              <button
                type='button'
                onClick={() => setProfileOpen((current) => !current)}
                className='flex h-11 items-center gap-2 rounded-md border border-white/20 bg-white/10 px-2 pr-3 text-left transition hover:border-[#f0c56a] hover:bg-white/15'
                aria-label='Open profile menu'
                aria-expanded={profileOpen}
              >
                <Avatar src={user.avatarUrl || undefined} fallback={initialsFor(user)} alt={user.fullName || user.email || 'Profile'} className='h-8 w-8 bg-[#f0c56a] text-[#06172f]' />
                <span className='hidden min-w-0 max-w-[150px] lg:block'>
                  <span className='block truncate text-xs font-extrabold text-white'>{user.fullName || user.email || 'Account'}</span>
                  <span className='block text-[10px] font-bold uppercase tracking-wide text-white/58'>{user.role}</span>
                </span>
                <ChevronDown className='h-3.5 w-3.5 text-white/70' />
              </button>

              {profileOpen && (
                <div className='absolute right-0 top-12 z-[95] w-[300px] overflow-hidden rounded-lg border border-[#d8c9b5] bg-white text-[#101828] shadow-[0_22px_70px_rgba(0,0,0,0.28)]'>
                  <div className='border-b border-[#eadfce] bg-[#fffdf8] p-4'>
                    <div className='flex items-center gap-3'>
                      <Avatar src={user.avatarUrl || undefined} fallback={initialsFor(user)} alt={user.fullName || user.email || 'Profile'} className='h-12 w-12 bg-[#f0c56a] text-[#06172f]' />
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-extrabold'>{user.fullName || 'Signed in user'}</p>
                        <p className='truncate text-xs text-[#667085]'>{user.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className='p-2'>
                    <Link href={dashboardPathForRole(user.role)} onClick={() => setProfileOpen(false)} className='flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-bold hover:bg-[#fff3dc]'>
                      <LayoutDashboard className='h-4 w-4 text-[#8a5a18]' />
                      Dashboard
                    </Link>
                    <Link href='/dashboard/profile' onClick={() => setProfileOpen(false)} className='flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-bold hover:bg-[#fff3dc]'>
                      <Settings className='h-4 w-4 text-[#8a5a18]' />
                      Profile settings
                    </Link>
                    <button type='button' onClick={handleSignOut} className='flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-bold text-[#b42318] hover:bg-[#fff1f2]'>
                      <LogOut className='h-4 w-4' />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
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
            <details className='group rounded-md'>
              <summary className='flex min-h-11 cursor-pointer list-none items-center justify-between rounded-md px-2 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10 hover:text-[#f0c56a]'>
                Categories
                <ChevronDown className='h-3.5 w-3.5 transition group-open:rotate-180' />
              </summary>
              <div className='grid gap-1 pb-2 pl-4'>
                <Link href='/marketplace' onClick={() => setMenuOpen(false)} className='rounded-md px-2 py-2 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-[#f0c56a]'>
                  All categories
                </Link>
                {categoryLinks.map(([label, href]) => (
                  <Link key={href} href={href} onClick={() => setMenuOpen(false)} className='rounded-md px-2 py-2 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-[#f0c56a]'>
                    {label}
                  </Link>
                ))}
              </div>
            </details>
            <Link href='/signup' onClick={() => setMenuOpen(false)} className='flex min-h-11 items-center rounded-md px-2 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10 hover:text-[#f0c56a]'>
              Become a Seller
            </Link>
            <details className='group rounded-md'>
              <summary className='flex min-h-11 cursor-pointer list-none items-center justify-between rounded-md px-2 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10 hover:text-[#f0c56a]'>
                Resources
                <ChevronDown className='h-3.5 w-3.5 transition group-open:rotate-180' />
              </summary>
              <div className='grid gap-1 pb-2 pl-4'>
                {resourceLinks.map(([label, href]) => (
                  <Link key={href} href={href} onClick={() => setMenuOpen(false)} className='rounded-md px-2 py-2 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-[#f0c56a]'>
                    {label}
                  </Link>
                ))}
              </div>
            </details>
            <div className='grid gap-2 border-t border-white/10 pt-3 sm:hidden'>
              {user ? (
                <>
                  <div className='rounded-md border border-white/10 bg-white/5 p-3'>
                    <div className='flex items-center gap-3'>
                      <Avatar src={user.avatarUrl || undefined} fallback={initialsFor(user)} alt={user.fullName || user.email || 'Profile'} className='h-11 w-11 bg-[#f0c56a] text-[#06172f]' />
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-extrabold text-white'>{user.fullName || user.email}</p>
                        <p className='text-xs font-bold uppercase tracking-wide text-white/55'>{user.role}</p>
                      </div>
                    </div>
                  </div>
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
