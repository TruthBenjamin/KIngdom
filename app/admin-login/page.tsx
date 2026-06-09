'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase-client'
import { getSessionUser } from '@/lib/auth/session'
import { authRedirectOrigin } from '@/lib/navigation'

const adminRoles = new Set(['admin', 'moderator'])

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
      if (error) throw error

      const sessionUser = await getSessionUser(supabase, {
        ensureProfile: false,
      })
      if (!sessionUser || !adminRoles.has(sessionUser.role)) {
        await supabase.auth.signOut()
        throw new Error('This account is not an admin or moderator.')
      }

      toast.success('Admin login successful')
      router.push('/dashboard/admin')
    } catch (error: any) {
      toast.error(error.message || 'Admin login failed')
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
    const normalizedEmail = email.trim().toLowerCase()
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${authRedirectOrigin()}/auth/update-password`,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password reset email sent!')
    }
    setLoading(false)
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-[#fffdf8] px-4 py-0 sm:py-12'>
      <div className='w-full max-w-md'>
        <Card className='border-0 bg-transparent shadow-none sm:border sm:border-[#eadfce] sm:bg-[#fffdf8] sm:shadow-[0_18px_60px_rgba(33,24,10,0.08)]'>
          <CardHeader className='text-center pt-12 sm:pt-6'>
            <CardTitle className='text-2xl'>Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className='space-y-4' autoComplete='on'>
              <div>
                <Label htmlFor='admin-email'>Email</Label>
                <Input
                  id='admin-email'
                  name='email'
                  type='email'
                  autoComplete='email'
                  autoCapitalize='none'
                  spellCheck={false}
                  value={email}
                  className='h-12 border-[#eadfce] bg-white'
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div>
                <div className='flex items-center justify-between'>
                  <Label htmlFor='admin-password'>Password</Label>
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
                  id='admin-password'
                  name='password'
                  type='password'
                  autoComplete='current-password'
                  value={password}
                  className='h-12 border-[#eadfce] bg-white'
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              <Button type='submit' className='h-12 w-full bg-[#101828] text-white hover:bg-[#1f2937]' disabled={loading}>
                {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {loading ? 'Signing in' : 'Sign in as admin'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
