import Link from 'next/link'
import { BadgeCheck, HeartHandshake, MessageCircle, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

const values = [
  ['Faithful service', HeartHandshake],
  ['Clear trust signals', BadgeCheck],
  ['Protected workflows', ShieldCheck],
  ['Real relationships', MessageCircle],
]

export default function About() {
  return (
    <div className='bg-white px-4 py-8 sm:px-6 sm:py-12'>
      <div className='mx-auto max-w-5xl'>
        <section className='rounded-lg border border-[#eadfce] bg-white p-6 shadow-[0_18px_60px_rgba(33,24,10,0.08)] sm:p-10'>
          <h1 className='max-w-3xl text-4xl font-extrabold leading-tight text-[#101828] sm:text-5xl'>
            About Kingdom Marketplace
          </h1>
          <div className='mt-7 flex flex-col gap-3 sm:flex-row'>
            <Link href='/marketplace'>
              <Button className='w-full bg-[#101828] text-white hover:bg-[#1f2937] sm:w-auto'>Find services</Button>
            </Link>
            <Link href='/signup'>
              <Button variant='outline' className='w-full border-[#d8aa5e] bg-white text-[#8a5a18] sm:w-auto'>Become a seller</Button>
            </Link>
          </div>
        </section>

        <section className='mt-5 grid gap-4 sm:grid-cols-2'>
          {values.map(([title, Icon]) => (
            <div key={title as string} className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
              <Icon className='h-6 w-6 text-[#8a5a18]' />
              <h2 className='mt-4 text-lg font-extrabold'>{title as string}</h2>
            </div>
          ))}
        </section>

        <section className='mt-5 rounded-lg border border-[#eadfce] bg-white p-6 sm:p-8'>
          <h2 className='text-2xl font-extrabold'>How the marketplace works</h2>
          <div className='mt-5 grid gap-4 md:grid-cols-3'>
            {[
              ['Buyers', 'Create an account, browse services, message sellers, book a service, and review completed work.'],
              ['Sellers', 'Create a seller profile, upload profile and listing media, submit services for review, then receive buyer messages and orders.'],
              ['Admins', 'Review pending sellers, approve or reject services, moderate reviews, and handle reports or disputes.'],
            ].map(([title, body]) => (
              <div key={title} className='rounded-lg bg-[#fffdf8] p-4'>
                <h3 className='font-extrabold'>{title}</h3>
                <p className='mt-2 text-sm leading-6 text-[#667085]'>{body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
