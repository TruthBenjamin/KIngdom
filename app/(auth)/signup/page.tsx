'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase-client'
import toast from 'react-hot-toast'

export default function SignUp() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'seller' | 'buyer'>('buyer')
  const [loading, setLoading] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState('')
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      })

      if (error) throw error

      setConfirmationEmail(email)
      toast.success('Account created. Confirm your email before signing in.')
    } catch (error: any) {
      toast.error(error.message || 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      toast.error(error.message || 'Google sign up failed')
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center px-4 py-8 sm:py-12'>
      <div className='w-full max-w-md'>
        <Card className='border-[#eadfce] bg-[#fffdf8] shadow-[0_18px_60px_rgba(33,24,10,0.08)]'>
          {confirmationEmail ? (
            <CardContent className='p-6 text-center sm:p-8'>
              <div className='mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-[#edbd68] text-2xl font-black text-[#101828]'>
                K
              </div>
              <h1 className='text-2xl font-extrabold'>Confirm your email</h1>
              <p className='mt-3 text-sm leading-6 text-muted-foreground'>
                We sent a confirmation link to <span className='font-semibold text-foreground'>{confirmationEmail}</span>.
                Open that email and click the link before signing in.
              </p>
              <p className='mt-4 rounded-lg border border-[#eadfce] bg-white px-4 py-3 text-sm text-muted-foreground'>
                No email yet? Check spam or promotions, then try signing up again with the same address.
              </p>
              <Link href='/login'>
                <Button className='mt-6 w-full bg-[#101828] text-white hover:bg-[#1f2937]'>
                  Go to login
                </Button>
              </Link>
            </CardContent>
          ) : (
          <>
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl'>Join Kingdom</CardTitle>
            <CardDescription>
              Create your account, then confirm your email to activate it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className='space-y-4'>
              <div>
                <Label htmlFor='fullName'>Full Name</Label>
                <Input
                  id='fullName'
                  type='text'
                  placeholder='John Doe'
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

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
                <Label htmlFor='role'>I want to</Label>
                <select
                  id='role'
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'seller' | 'buyer')}
                  className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm'
                >
                  <option value='buyer'>Find creators (Buyer)</option>
                  <option value='seller'>Offer services (Creator)</option>
                </select>
              </div>

              <div>
                <Label htmlFor='password'>Password</Label>
                <Input
                  id='password'
                  type='password'
                  placeholder='••••••••'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor='confirmPassword'>Confirm Password</Label>
                <Input
                  id='confirmPassword'
                  type='password'
                  placeholder='••••••••'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type='submit'
                className='w-full'
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create Account'}
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
              onClick={handleGoogleSignUp}
            >
              Sign up with Google
            </Button>

            <p className='mt-6 text-center text-sm text-muted-foreground'>
              Already have an account?{' '}
              <Link href='/login' className='font-semibold text-primary hover:underline'>
                Sign in
              </Link>
            </p>
          </CardContent>
          </>
          )}
        </Card>
      </div>
    </div>
  )
}
