import Link from 'next/link'
import { BadgeCheck, HeartHandshake, MessageCircle, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

const values = [
  ['Faithful service', 'A marketplace for creators and buyers who want excellent work shaped by shared values.', HeartHandshake],
  ['Clear trust signals', 'Profiles, service details, reviews, and moderation status help buyers make better decisions.', BadgeCheck],
  ['Protected workflows', 'Messaging, booking, delivery, revision, and review steps are kept inside the platform.', ShieldCheck],
  ['Real relationships', 'Buyers can talk with creators before hiring, then return to trusted sellers for future work.', MessageCircle],
]

export default function About() {
  return (
    <div className='bg-[#f7f3ec] px-4 py-8 sm:px-6 sm:py-12'>
      <div className='mx-auto max-w-5xl'>
        <section className='rounded-lg border border-[#eadfce] bg-white p-6 shadow-[0_18px_60px_rgba(33,24,10,0.08)] sm:p-10'>
          <p className='text-sm font-bold text-[#a36d1b]'>About Kingdom Marketplace</p>
          <h1 className='mt-3 max-w-3xl text-4xl font-extrabold leading-tight text-[#101828] sm:text-5xl'>
            A faith-centered place to find, hire, and review trusted creators.
          </h1>
          <p className='mt-5 max-w-3xl text-base leading-7 text-[#667085]'>
            Kingdom Marketplace helps ministries, businesses, and individuals discover Christian creatives and professionals for design, media, writing, web, music, and other service needs.
          </p>
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
          {values.map(([title, body, Icon]) => (
            <div key={title as string} className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
              <Icon className='h-6 w-6 text-[#8a5a18]' />
              <h2 className='mt-4 text-lg font-extrabold'>{title as string}</h2>
              <p className='mt-2 text-sm leading-6 text-[#5b6472]'>{body as string}</p>
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
