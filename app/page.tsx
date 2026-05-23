'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Star, Briefcase, Users, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

const categories = [
  { name: 'Music & Audio', icon: '🎵', count: '342' },
  { name: 'Design', icon: '🎨', count: '567' },
  { name: 'Writing', icon: '✍️', count: '234' },
  { name: 'Photography', icon: '📸', count: '189' },
  { name: 'Video', icon: '🎬', count: '276' },
  { name: 'Programming', icon: '💻', count: '445' },
  { name: 'Marketing', icon: '📢', count: '312' },
  { name: 'Consulting', icon: '💼', count: '198' },
]

const featured = [
  {
    id: '1',
    name: 'Sarah Johnson',
    title: 'Brand Designer & Creative Director',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    rating: 4.9,
    reviews: 142,
    skills: ['Branding', 'Logo Design', 'Web Design'],
    priceRange: '$500-$5000',
  },
  {
    id: '2',
    name: 'Michael Chen',
    title: 'Full-Stack Web Developer',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    rating: 4.95,
    reviews: 198,
    skills: ['React', 'Node.js', 'AWS'],
    priceRange: '$3000-$10000',
  },
  {
    id: '3',
    name: 'Emma Rodriguez',
    title: 'Content & Copywriter',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    rating: 4.8,
    reviews: 87,
    skills: ['Blog Writing', 'Copywriting', 'SEO'],
    priceRange: '$1000-$3000',
  },
]

const testimonials = [
  {
    quote:
      'Kingdom Marketplace helped us find the perfect designer for our church rebrand. The quality is exceptional!',
    author: 'Pastor David',
    role: 'Grace Community Church',
  },
  {
    quote:
      'As a freelancer, I love the faith-centered community here. The clients are wonderful and the platform is easy to use.',
    author: 'Jennifer',
    role: 'Freelance Designer',
  },
  {
    quote:
      'Finding trustworthy Christian professionals used to be difficult. This platform changed everything for us.',
    author: 'Ministry Director',
    role: 'Hope Ministries',
  },
]

const stats = [
  { label: 'Active Creatives', value: '2,847' },
  { label: 'Successful Projects', value: '12,543' },
  { label: 'Satisfied Clients', value: '8,920' },
  { label: 'Industries Served', value: '47' },
]

export default function Home() {
  return (
    <div className='w-full'>
      {/* Hero Section */}
      <section className='relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20'>
        <div className='absolute inset-0 -z-10 h-full w-full'>
          <div className='absolute top-20 right-20 h-72 w-72 bg-primary/10 rounded-full blur-3xl' />
          <div className='absolute bottom-20 left-20 h-72 w-72 bg-secondary/10 rounded-full blur-3xl' />
        </div>

        <div className='container mx-auto px-4'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='text-center max-w-3xl mx-auto'
          >
            <Badge className='mb-6 inline-block' variant='secondary'>
              Faith-Centered Marketplace
            </Badge>

            <h1 className='text-5xl md:text-7xl font-bold mb-6 leading-tight'>
              Kingdom talent,{' '}
              <span className='text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary'>
                trusted solutions
              </span>
            </h1>

            <p className='text-xl text-muted-foreground mb-8 leading-relaxed'>
              Connect with Christian creatives, freelancers, and professionals.
              Find vetted talent for your ministry, business, or personal projects.
            </p>

            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link href='/signup'>
                <Button size='lg' className='w-full sm:w-auto'>
                  Get Started <ArrowRight className='ml-2 h-4 w-4' />
                </Button>
              </Link>
              <Link href='/marketplace'>
                <Button size='lg' variant='outline' className='w-full sm:w-auto'>
                  Browse Creators
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className='mt-20 grid grid-cols-2 md:grid-cols-4 gap-8'
          >
            {stats.map((stat, i) => (
              <div key={i} className='text-center'>
                <div className='text-3xl md:text-4xl font-bold text-primary mb-2'>
                  {stat.value}
                </div>
                <div className='text-sm text-muted-foreground'>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className='py-20 bg-background'>
        <div className='container mx-auto px-4'>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className='text-center mb-12'
          >
            <h2 className='text-4xl font-bold mb-4'>Browse by Category</h2>
            <p className='text-muted-foreground'>Find the perfect professional for your needs</p>
          </motion.div>

          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {categories.map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Link href={`/marketplace?category=${cat.name.toLowerCase()}`}>
                  <Card className='hover:border-primary transition-colors cursor-pointer h-full'>
                    <CardContent className='p-6 text-center'>
                      <div className='text-4xl mb-3'>{cat.icon}</div>
                      <h3 className='font-semibold mb-1'>{cat.name}</h3>
                      <p className='text-sm text-muted-foreground'>{cat.count} creators</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Creators */}
      <section className='py-20 bg-muted/30'>
        <div className='container mx-auto px-4'>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className='text-center mb-12'
          >
            <h2 className='text-4xl font-bold mb-4'>Featured Creators</h2>
            <p className='text-muted-foreground'>Meet some of our top professionals</p>
          </motion.div>

          <div className='grid md:grid-cols-3 gap-6'>
            {featured.map((creator, i) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link href={`/creator/${creator.id}`}>
                  <Card className='hover:shadow-lg transition-all cursor-pointer overflow-hidden'>
                    <div className='h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center'>
                      <div
                        className='h-32 w-32 rounded-full bg-muted'
                        style={{
                          backgroundImage: `url(${creator.image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      />
                    </div>
                    <CardContent className='p-6'>
                      <h3 className='font-semibold text-lg'>{creator.name}</h3>
                      <p className='text-sm text-muted-foreground mb-3'>{creator.title}</p>

                      <div className='flex items-center gap-1 mb-4'>
                        <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
                        <span className='text-sm font-semibold'>{creator.rating}</span>
                        <span className='text-xs text-muted-foreground'>({creator.reviews})</span>
                      </div>

                      <div className='flex flex-wrap gap-1 mb-4'>
                        {creator.skills.map((skill) => (
                          <Badge key={skill} variant='secondary' className='text-xs'>
                            {skill}
                          </Badge>
                        ))}
                      </div>

                      <p className='text-sm font-semibold text-primary'>{creator.priceRange}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className='py-20 bg-background'>
        <div className='container mx-auto px-4'>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className='text-center mb-12'
          >
            <h2 className='text-4xl font-bold mb-4'>How It Works</h2>
            <p className='text-muted-foreground'>Simple process to find and hire talent</p>
          </motion.div>

          <div className='grid md:grid-cols-4 gap-6'>
            {[
              {
                step: '1',
                title: 'Browse',
                description: 'Explore our diverse marketplace of talented creatives',
                icon: <Briefcase className='h-8 w-8' />,
              },
              {
                step: '2',
                title: 'Connect',
                description: 'Message creators directly to discuss your project',
                icon: <Users className='h-8 w-8' />,
              },
              {
                step: '3',
                title: 'Hire',
                description: 'Agree on terms and get started on your project',
                icon: <Zap className='h-8 w-8' />,
              },
              {
                step: '4',
                title: 'Review',
                description: 'Leave feedback and build lasting business relationships',
                icon: <Star className='h-8 w-8' />,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card>
                  <CardContent className='p-6'>
                    <div className='h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4'>
                      {item.icon}
                    </div>
                    <h3 className='font-semibold mb-2 text-lg'>{item.title}</h3>
                    <p className='text-sm text-muted-foreground'>{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className='py-20 bg-muted/30'>
        <div className='container mx-auto px-4'>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className='text-center mb-12'
          >
            <h2 className='text-4xl font-bold mb-4'>What People Say</h2>
            <p className='text-muted-foreground'>Trusted by creators and clients worldwide</p>
          </motion.div>

          <div className='grid md:grid-cols-3 gap-6'>
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card>
                  <CardContent className='p-6'>
                    <div className='flex gap-1 mb-4'>
                      {[...Array(5)].map((_, j) => (
                        <Star
                          key={j}
                          className='h-4 w-4 fill-yellow-400 text-yellow-400'
                        />
                      ))}
                    </div>
                    <p className='text-muted-foreground mb-4 italic'>
                      "{testimonial.quote}"
                    </p>
                    <div>
                      <p className='font-semibold'>{testimonial.author}</p>
                      <p className='text-sm text-muted-foreground'>{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-20 bg-primary text-primary-foreground'>
        <div className='container mx-auto px-4 text-center'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className='text-4xl font-bold mb-4'>Ready to Get Started?</h2>
            <p className='text-lg mb-8 opacity-90'>
              Join our community of faith-centered creatives and professionals
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link href='/signup'>
                <Button
                  size='lg'
                  className='w-full sm:w-auto bg-primary-foreground text-primary hover:bg-primary-foreground/90'
                >
                  Sign Up as Creator <ArrowRight className='ml-2 h-4 w-4' />
                </Button>
              </Link>
              <Link href='/marketplace'>
                <Button
                  size='lg'
                  variant='outline'
                  className='w-full sm:w-auto border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10'
                >
                  Browse Marketplace
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
