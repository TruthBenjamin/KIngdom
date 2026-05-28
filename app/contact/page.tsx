'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const subject = encodeURIComponent(`Kingdom Marketplace message from ${name}`)
    const body = encodeURIComponent(`${message}\n\nFrom: ${name}\nEmail: ${email}`)
    window.location.href = `mailto:support@kingdom.example?subject=${subject}&body=${body}`
    toast.success('Opening your email app so you can send the message.')
    setLoading(false)
  }

  return (
    <div className='min-h-screen py-12'>
      <div className='container mx-auto px-4 max-w-2xl'>
        <h1 className='text-4xl font-bold mb-6 text-center'>Contact Us</h1>
        <p className='text-muted-foreground text-center mb-12'>
          Have a question or feedback? We&apos;d love to hear from you.
        </p>

        <Card>
          <CardContent className='p-8'>
            <form onSubmit={handleSubmit} className='space-y-6'>
              <div>
                <Label htmlFor='name'>Name</Label>
                <Input
                  id='name'
                  placeholder='Your name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='your@email.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor='message'>Message</Label>
                <Textarea
                  id='message'
                  placeholder='Tell us what you think...'
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className='min-h-32'
                />
              </div>

              <Button type='submit' className='w-full' disabled={loading}>
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
