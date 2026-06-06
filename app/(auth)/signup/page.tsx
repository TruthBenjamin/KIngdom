'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { termsLastUpdated, termsSections } from '@/lib/legal/terms'
import { createClient } from '@/lib/supabase-client'
import toast from 'react-hot-toast'

export default function SignUp() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'seller' | 'buyer'>('buyer')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState('')
  const supabase = useMemo(() => createClient(), [])
  const formRef = useRef<HTMLFormElement | null>(null)

  const redirectOrigin = () => {
    const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
    if (configuredOrigin && window.location.hostname === 'localhost') return configuredOrigin
    return window.location.origin
  }

  // Coherent autofill management
  useEffect(() => {
    setFullName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    formRef.current?.reset()

    const clearAutofill = window.setTimeout(() => {
      setFullName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      formRef.current?.reset()
    }, 100)

    return () => window.clearTimeout(clearAutofill)
  }, [])

  useEffect(() => {
    const requestedRole = new URLSearchParams(window.location.search).get('role')
    if (requestedRole === 'seller' || requestedRole === 'buyer') setRole(requestedRole)
  }, [])

  useEffect(() => {
    if (!termsOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setTermsOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [termsOpen])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (!termsAccepted) {
      toast.error('Accept the Terms of Service before creating your account')
      setTermsOpen(true)
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${redirectOrigin()}/auth/callback`,
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
    if (!termsAccepted) {
      toast.error('Accept the Terms of Service before signing up with Google')
      setTermsOpen(true)
      return
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${redirectOrigin()}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      toast.error(error.message || 'Google sign up failed')
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-white px-4 py-8 sm:py-12'>
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
              <Link href='/login?confirmEmail=1'>
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
              Create an account with the role you want to use first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form ref={formRef} onSubmit={handleSignUp} className='space-y-4' autoComplete='off'>
              <div>
                <Label htmlFor='fullName'>Full Name</Label>
                <Input
                  id='fullName'
                  type='text'
                  placeholder='John Doe'
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete='off'
                  data-1p-ignore='true'
                  data-lpignore='true'
                  required
                />
              </div>

              <div>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  name='kingdom-new-identity'
                  type='email'
                  placeholder='you@example.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete='off'
                  autoCapitalize='none'
                  spellCheck={false}
                  data-1p-ignore='true'
                  data-lpignore='true'
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
                  name='kingdom-new-secret'
                  type='password'
                  placeholder='Password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete='new-password'
                  data-1p-ignore='true'
                  data-lpignore='true'
                  required
                />
              </div>

              <div>
                <Label htmlFor='confirmPassword'>Confirm Password</Label>
                <Input
                  id='confirmPassword'
                  type='password'
                  placeholder='Confirm password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete='new-password'
                  data-1p-ignore='true'
                  data-lpignore='true'
                  required
                />
              </div>

              <div className='rounded-lg border border-[#eadfce] bg-white p-3'>
                <div className='flex items-start gap-3'>
                  <input
                    id='termsAccepted'
                    type='checkbox'
                    checked={termsAccepted}
                    onChange={(event) => setTermsAccepted(event.target.checked)}
                    aria-describedby='termsAcceptedText'
                    className='mt-1 h-4 w-4 rounded border-[#d0d5dd] text-primary focus:ring-primary'
                    required
                  />
                  <p id='termsAcceptedText' className='text-sm leading-6 text-muted-foreground'>
                    <label htmlFor='termsAccepted'>I agree to Kingdom Marketplace&apos;s</label>{' '}
                    <button
                      type='button'
                      onClick={() => setTermsOpen(true)}
                      className='font-semibold text-primary underline-offset-4 hover:underline'
                    >
                      Terms of Service
                    </button>
                    .
                  </p>
                </div>
              </div>

              <Button
                type='submit'
                className='w-full bg-[#101828] text-white hover:bg-[#1f2937]'
                disabled={loading}
              >
                {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {loading ? 'Creating account' : 'Create account'}
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
              disabled={loading}
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

      {termsOpen && (
        <div
          className='fixed inset-0 z-[70] flex items-center justify-center bg-[#06172f]/70 px-4 py-6 backdrop-blur-sm'
          role='dialog'
          aria-modal='true'
          aria-labelledby='terms-dialog-title'
          onMouseDown={() => setTermsOpen(false)}
        >
          <div
            className='flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-[#eadfce] bg-white shadow-[0_24px_80px_rgba(6,23,47,0.28)]'
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className='flex items-start justify-between gap-4 border-b border-[#eadfce] p-5'>
              <div>
                <p className='text-xs font-bold uppercase tracking-[0.12em] text-[#a36d1b]'>Last updated: {termsLastUpdated}</p>
                <h2 id='terms-dialog-title' className='mt-2 text-2xl font-extrabold text-[#101828]'>
                  Terms of Service
                </h2>
              </div>
              <button
                type='button'
                onClick={() => setTermsOpen(false)}
                className='grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[#eadfce] text-[#667085] transition hover:bg-[#fff8ec] hover:text-[#101828]'
                aria-label='Close terms'
              >
                <X className='h-4 w-4' />
              </button>
            </div>

            <div className='overflow-y-auto p-5'>
              <p className='text-sm leading-6 text-[#667085]'>
                Review the marketplace terms before creating your account.
              </p>
              <div className='mt-5 grid gap-4'>
                {termsSections.map((section, index) => (
                  <section key={section.title} className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-4'>
                    <h3 className='font-extrabold text-[#101828]'>
                      {index + 1}. {section.title}
                    </h3>
                    <p className='mt-2 text-sm leading-6 text-[#5b6472]'>{section.body}</p>
                  </section>
                ))}
              </div>
            </div>

            <div className='flex flex-col gap-3 border-t border-[#eadfce] bg-[#fffdf8] p-5 sm:flex-row sm:items-center sm:justify-between'>
              <Link href='/terms' className='text-sm font-semibold text-primary hover:underline'>
                Open full terms page
              </Link>
              <Button
                type='button'
                onClick={() => {
                  setTermsAccepted(true)
                  setTermsOpen(false)
                }}
                className='bg-[#101828] text-white hover:bg-[#1f2937]'
              >
                Accept terms
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
