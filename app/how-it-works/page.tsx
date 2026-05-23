'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Browse Creators',
      description: 'Explore our diverse marketplace of talented Christian professionals. Search by category or skill.',
      icon: '🔍',
    },
    {
      number: '2',
      title: 'Review Portfolio',
      description: 'Check out their past work, ratings, reviews, and testimonials from other clients.',
      icon: '👀',
    },
    {
      number: '3',
      title: 'Send Message',
      description: 'Reach out directly to discuss your project, ask questions, and negotiate terms.',
      icon: '💬',
    },
    {
      number: '4',
      title: 'Agree & Hire',
      description: 'Once you agree on terms, pricing, and timeline, mark the project as "Hired".',
      icon: '🤝',
    },
    {
      number: '5',
      title: 'Communication',
      description: 'Work together using our built-in messaging. Share files and updates seamlessly.',
      icon: '📱',
    },
    {
      number: '6',
      title: 'Review & Rate',
      description: 'Leave feedback and rate the creator. Help build their reputation and trust.',
      icon: '⭐',
    },
  ]

  return (
    <div className='min-h-screen py-12'>
      <div className='container mx-auto px-4'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold mb-4'>How Kingdom Works</h1>
          <p className='text-xl text-muted-foreground'>
            Simple process to find and work with Christian creatives
          </p>
        </div>

        {/* Steps */}
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12'>
          {steps.map((step, i) => (
            <Card key={i}>
              <CardContent className='p-6'>
                <div className='flex items-start gap-4'>
                  <div className='text-4xl'>{step.icon}</div>
                  <div>
                    <h3 className='font-bold text-lg mb-2'>{step.title}</h3>
                    <p className='text-muted-foreground text-sm'>{step.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className='bg-muted/30 rounded-lg p-8 mb-12'>
          <h2 className='text-3xl font-bold mb-8'>Frequently Asked Questions</h2>
          
          <div className='space-y-6'>
            {[
              {
                q: 'Is there a service fee?',
                a: 'Kingdom Marketplace is currently free for both buyers and sellers. We may introduce optional features later.',
              },
              {
                q: 'How do I know if a creator is trustworthy?',
                a: 'Check their ratings, reviews from other clients, portfolio work, and years of experience. All creators are verified Christians.',
              },
              {
                q: 'What if I\'m not happy with the work?',
                a: 'Communicate directly with your creator through messaging. We encourage resolving issues through professional discussion.',
              },
              {
                q: 'How do payments work?',
                a: 'Payments are arranged directly between you and the creator. We recommend discussing payment terms before starting work.',
              },
              {
                q: 'Can I hire someone for ongoing projects?',
                a: 'Absolutely! Many creators offer retainer or ongoing services. Discuss long-term arrangements in your first message.',
              },
              {
                q: 'Is my information secure?',
                a: 'Yes! We use industry-standard security measures and encryption to protect your data.',
              },
            ].map((faq, i) => (
              <div key={i} className='border-b border-border pb-6 last:border-0'>
                <h4 className='font-semibold text-lg mb-2'>{faq.q}</h4>
                <p className='text-muted-foreground'>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className='text-center'>
          <h2 className='text-3xl font-bold mb-4'>Ready to Get Started?</h2>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link href='/signup'>
              <Button size='lg'>Sign Up as Creator</Button>
            </Link>
            <Link href='/marketplace'>
              <Button size='lg' variant='outline'>Browse Creators</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
