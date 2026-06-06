'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { dashboardPathForRole, getSessionUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase-client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const formRef = useRef<HTMLFormElement | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Coherent autofill and state management with admin-login
  useEffect(() => {
    setEmail('')
    setPassword('')
    formRef.current?.reset()

    if (window.location.search || window.location.hash) {
      window.history.replaceState(null, '', '/login')
    }

    const clearAutofill = window.setTimeout(() => {
      setEmail('')
      setPassword('')
      formRef.current?.reset()
    }, 100)

    return () => window.clearTimeout(clearAutofill)
  }, [])

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const sessionUser = await getSessionUser(supabase)
      toast.success('Login successful')
      router.push(dashboardPathForRole(sessionUser?.role || 'buyer'))
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email address first.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password reset email sent! Check your inbox.')
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      toast.error(error.message || 'Google login failed')
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-white px-4 py-8 sm:py-12'>
      <div className='w-full max-w-md'>
        <Card className='border-[#eadfce] bg-[#fffdf8] shadow-[0_18px_60px_rgba(33,24,10,0.08)]'>
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl'>Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form ref={formRef} onSubmit={handleLogin} className='space-y-4' autoComplete='off'>
              <div>
                <Label htmlFor='email'>Email Address</Label>
                <Input
                  id='email'
                  name='kingdom-identity'
                  type='email'
                  autoComplete='off'
                  autoCapitalize='none'
                  spellCheck={false}
                  placeholder='name@example.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-1p-ignore='true'
                  data-lpignore='true'
                  required
                />
              </div>

              <div>
                <div className='flex items-center justify-between'>
                  <Label htmlFor='password'>Password</Label>
                  <button
                    type='button'
                    onClick={handleForgotPassword}
                    className='text-xs text-muted-foreground transition-colors hover:text-[#101828]'
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id='password'
                  name='kingdom-secret'
                  type='password'
                  autoComplete='new-password'
                  placeholder='••••••••'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-1p-ignore='true'
                  data-lpignore='true'
                  required
                />
              </div>

              <Button type='submit' className='w-full bg-[#101828] text-white hover:bg-[#1f2937]' disabled={loading}>
                {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className='relative my-6'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t' />
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='bg-[#fffdf8] px-2 text-muted-foreground'>Or</span>
              </div>
            </div>

            <Button
              type='button'
              variant='outline'
              className='w-full border-[#eadfce] hover:bg-[#fff8ec]'
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className='mr-2 h-4 w-4' aria-hidden='true' focusable='false' data-prefix='fab' data-icon='google' role='img' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 488 512'>
                <path fill='currentColor' d='M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z' />
              </svg>
              Sign in with Google
            </Button>

            <div className='mt-6 text-center text-sm'>
              <span className='text-muted-foreground'>Don&apos;t have an account? </span>
              <Link href='/signup' className='font-medium text-[#101828] hover:underline'>
                Sign Up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
