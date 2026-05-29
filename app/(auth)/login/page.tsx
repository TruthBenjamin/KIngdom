'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase-client'
import { dashboardPathForRole, getSessionUser } from '@/lib/auth/session'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      const sessionUser = await getSessionUser(supabase)
      toast.success('Logged in successfully!')
      if (sessionUser?.needsRoleOnboarding) {
        router.push('/onboarding/role')
        return
      }

      router.push(dashboardPathForRole(sessionUser?.role || 'buyer'))
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
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
    <div className='flex min-h-screen items-center justify-center bg-[#f7f3ec] px-4 py-8 sm:py-12'>
      <div className='w-full max-w-md'>
        <Card className='border-[#eadfce] bg-[#fffdf8] shadow-[0_18px_60px_rgba(33,24,10,0.08)]'>
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl'>Welcome back</CardTitle>
            <CardDescription>
              Sign in to continue to the right dashboard for your role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='mb-5 rounded-lg border border-[#eadfce] bg-white px-4 py-3 text-sm text-muted-foreground'>
              New account? Confirm your email first, then come back here to log in.
            </div>
            <form onSubmit={handleEmailLogin} className='space-y-4'>
              <div>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='you@example.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor='password'>Password</Label>
                <Input
                  id='password'
                  type='password'
                  placeholder='Password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type='submit'
                className='w-full'
                disabled={loading}
              >
                {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {loading ? 'Signing in' : 'Sign in'}
              </Button>
            </form>

            <div className='relative my-6'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t' />
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='bg-background px-2 text-muted-foreground'>Or</span>
              </div>
            </div>

            <Button
              type='button'
              variant='outline'
              className='w-full'
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              Continue with Google
            </Button>

            <p className='mt-6 text-center text-sm text-muted-foreground'>
              Don&apos;t have an account?{' '}
              <Link href='/signup' className='font-semibold text-primary hover:underline'>
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
