'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Users, Globe } from 'lucide-react'

export default function About() {
  return (
    <div className='min-h-screen py-12'>
      <div className='container mx-auto px-4 max-w-4xl'>
        <h1 className='text-4xl font-bold mb-6'>About Kingdom Marketplace</h1>

        <div className='space-y-8'>
          <section>
            <h2 className='text-2xl font-bold mb-4'>Our Mission</h2>
            <p className='text-muted-foreground text-lg leading-relaxed'>
              To connect the global faith community by providing a trusted marketplace where Christian creatives, 
              freelancers, and professionals can showcase their talents and serve others with excellence and integrity.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-bold mb-4'>Our Values</h2>
            <div className='grid md:grid-cols-3 gap-6'>
              {[
                {
                  icon: <Heart className='h-8 w-8 text-red-500' />,
                  title: 'Faith-Centered',
                  description: 'Everything we do is rooted in Christian values and service.',
                },
                {
                  icon: <Users className='h-8 w-8 text-blue-500' />,
                  title: 'Community',
                  description: 'We believe in the power of believers lifting each other up.',
                },
                {
                  icon: <Globe className='h-8 w-8 text-green-500' />,
                  title: 'Excellence',
                  description: 'We serve with professionalism and highest standards.',
                },
              ].map((value, i) => (
                <Card key={i}>
                  <CardContent className='p-6 text-center'>
                    <div className='mb-4 flex justify-center'>{value.icon}</div>
                    <h3 className='font-bold text-lg mb-2'>{value.title}</h3>
                    <p className='text-muted-foreground'>{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className='text-2xl font-bold mb-4'>Why Kingdom?</h2>
            <p className='text-muted-foreground text-lg leading-relaxed mb-4'>
              Kingdom Marketplace was created to solve a real problem in the faith community: 
              finding trustworthy, skilled Christian professionals for your ministry or business needs.
            </p>
            <p className='text-muted-foreground text-lg leading-relaxed'>
              Whether you need a designer for your church, a developer for your ministry website, 
              or any other professional service, Kingdom connects you with vetted Christians who 
              share your values and commitment to excellence.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-bold mb-4'>For Creators</h2>
            <p className='text-muted-foreground text-lg leading-relaxed'>
              If you're a Christian creative professional, Kingdom provides a platform to showcase your talents 
              to a community that values your faith and work. Build your reputation, grow your client base, 
              and do work that matters with people who share your beliefs.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
