import Link from 'next/link'
import { Eye, MessageCircle, Search, ShieldCheck, Star, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

const steps = [
  {
    title: 'Browse creators',
    description: 'Search services by category, skill, delivery time, or creator style.',
    icon: Search,
  },
  {
    title: 'Review portfolios',
    description: 'Compare past work, service details, ratings, and reviews before you reach out.',
    icon: Eye,
  },
  {
    title: 'Send a message',
    description: 'Discuss the goal, files, timeline, budget, and expectations before work begins.',
    icon: MessageCircle,
  },
  {
    title: 'Agree and hire',
    description: 'Confirm scope, deliverables, milestones, and beta payment terms before work begins.',
    icon: UserCheck,
  },
  {
    title: 'Work with clarity',
    description: 'Keep updates, revisions, and project notes organized as the work moves forward.',
    icon: ShieldCheck,
  },
  {
    title: 'Review and return',
    description: 'Rate the creator, save trusted partners, and build your go-to kingdom team.',
    icon: Star,
  },
]

const faqs = [
  {
    q: 'Is there a service fee?',
    a: 'Kingdom Marketplace is currently free for buyers and sellers while the platform grows.',
  },
  {
    q: 'How do I choose the right creator?',
    a: 'Start with category fit, then compare examples, reviews, response time, and how clearly they answer your project brief.',
  },
  {
    q: 'How do payments work?',
    a: 'The current beta payment system supports protected marketplace workflow testing. It is not connected to a live payment provider yet.',
  },
  {
    q: 'Can I hire for ongoing work?',
    a: 'Yes. Many creators can support retainers, recurring media needs, and long-term ministry or business projects.',
  },
]

export default function HowItWorks() {
  return (
    <div className='min-h-screen bg-[#f7f3ec] px-3 py-6 sm:px-6 sm:py-10'>
      <div className='mx-auto max-w-6xl'>
        <section className='rounded-lg border border-[#eadfce] bg-white p-6 shadow-[0_18px_60px_rgba(33,24,10,0.08)] sm:p-10'>
          <div className='max-w-3xl'>
            <p className='text-sm font-bold text-[#a36d1b]'>How Kingdom works</p>
            <h1 className='mt-3 text-4xl font-extrabold leading-tight text-[#101828] sm:text-5xl'>
              Find faithful creative help without the guesswork.
            </h1>
            <p className='mt-4 text-base leading-7 text-[#667085] sm:text-lg'>
              Kingdom keeps discovery, conversation, and project decisions simple so ministries and businesses can hire with confidence.
            </p>
          </div>
        </section>

        <section className='mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {steps.map(({ title, description, icon: Icon }, index) => (
            <div key={title} className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
              <div className='flex items-center justify-between gap-4'>
                <div className='grid h-11 w-11 place-items-center rounded-lg bg-[#101828] text-[#edbd68]'>
                  <Icon className='h-5 w-5' />
                </div>
                <span className='text-sm font-black text-[#d8c9b5]'>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <h2 className='mt-5 text-lg font-extrabold'>{title}</h2>
              <p className='mt-2 text-sm leading-6 text-[#5b6472]'>{description}</p>
            </div>
          ))}
        </section>

        <section className='mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]'>
          <div className='rounded-lg bg-[#101828] p-6 text-white sm:p-8'>
            <h2 className='text-2xl font-extrabold'>Ready to begin?</h2>
            <p className='mt-3 text-sm leading-6 text-white/70'>
              Browse services for immediate project needs or create a seller profile to offer your craft to the community.
            </p>
            <div className='mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1'>
              <Link href='/marketplace'>
                <Button className='w-full bg-[#edbd68] text-[#101828] hover:bg-[#d8952f]'>Browse creators</Button>
              </Link>
              <Link href='/signup'>
                <Button variant='outline' className='w-full border-white/25 bg-transparent text-white hover:bg-white/10'>Become a creator</Button>
              </Link>
            </div>
          </div>

          <div className='rounded-lg border border-[#eadfce] bg-white p-6 sm:p-8'>
            <h2 className='text-2xl font-extrabold'>Frequently asked questions</h2>
            <div className='mt-6 divide-y divide-[#eadfce]'>
              {faqs.map((faq) => (
                <div key={faq.q} className='py-5 first:pt-0 last:pb-0'>
                  <h3 className='font-bold'>{faq.q}</h3>
                  <p className='mt-2 text-sm leading-6 text-[#5b6472]'>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
