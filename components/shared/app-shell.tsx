'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/shared/header'
import { Footer } from '@/components/shared/footer'

const appRoutePrefixes = [
  '/admin-login',
  '/auth',
  '/checkout',
  '/dashboard',
  '/listing',
  '/login',
  '/marketplace',
  '/onboarding',
  '/profile',
  '/signup',
  '/u',
]

function shouldShowFooter(pathname: string) {
  return !appRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/'
  const showFooter = shouldShowFooter(pathname)

  return (
    <div className='flex min-h-screen flex-col'>
      <Header />
      <main className='flex-1'>{children}</main>
      {showFooter && <Footer />}
    </div>
  )
}
