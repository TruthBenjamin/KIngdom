import Link from 'next/link'
import { termsLastUpdated, termsSections } from '@/lib/legal/terms'

export default function Terms() {
  return (
    <div className='bg-white px-4 py-8 sm:px-6 sm:py-12'>
      <div className='mx-auto max-w-4xl'>
        <div className='border-b border-[#eadfce] pb-8'>
          <p className='text-sm font-bold text-[#a36d1b]'>Last updated: {termsLastUpdated}</p>
          <h1 className='mt-3 text-4xl font-extrabold text-[#101828]'>Terms of Service</h1>
          <p className='mt-4 max-w-3xl text-sm leading-6 text-[#667085]'>
            These terms describe how Kingdom Marketplace accounts, services, hiring, messaging, reviews, payments, and moderation work during public beta.
          </p>
        </div>

        <div className='mt-8 grid gap-4'>
          {termsSections.map((section, index) => (
            <section key={section.title} className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
              <h2 className='text-lg font-extrabold text-[#101828]'>
                {index + 1}. {section.title}
              </h2>
              <p className='mt-2 text-sm leading-6 text-[#5b6472]'>{section.body}</p>
            </section>
          ))}
        </div>

        <p className='mt-8 rounded-lg border border-[#eadfce] bg-white p-5 text-sm leading-6 text-[#5b6472]'>
          These terms are designed for the current Kingdom Marketplace beta and are not a substitute for legal advice.
          For questions, contact us through the{' '}
          <Link href='/contact' className='font-bold text-[#a36d1b] hover:underline'>
            contact page
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
