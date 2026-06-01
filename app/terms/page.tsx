const sections = [
  ['Accounts and roles', 'You may create an account as a buyer or seller. Sellers can activate seller mode, complete a profile, list services, and submit services for review. Buyers can browse, save, message, hire, and review sellers.'],
  ['Service listings', 'Service listings must be accurate, lawful, and owned or authorized by the seller. Submitted services may remain pending until an admin reviews and approves them.'],
  ['Hiring and orders', 'A buyer hires a seller by booking a service and completing the checkout workflow. Order messages, requirements, deliveries, revisions, cancellation requests, and disputes should stay inside Kingdom Marketplace.'],
  ['Reviews', 'Reviews are intended for buyers who completed an order. We may hide or flag reviews that are abusive, misleading, spammy, or unrelated to the completed service.'],
  ['Moderation', 'We may verify sellers, approve or reject services, pause listings, restrict accounts, review reports, and keep audit records to protect the marketplace.'],
  ['Beta payments', 'Payment, refund, withdrawal, and adjustment tools may be beta records unless a live payment provider is connected and clearly shown during checkout.'],
  ['User conduct', 'Use the platform respectfully. Do not harass users, upload harmful content, impersonate others, avoid platform safeguards, or misuse reports and messages.'],
  ['Contact', 'Questions about these terms can be sent through the contact page.'],
]

export default function Terms() {
  return (
    <div className='bg-[#f7f3ec] px-4 py-8 sm:px-6 sm:py-12'>
      <div className='mx-auto max-w-4xl rounded-lg border border-[#eadfce] bg-white p-6 shadow-[0_18px_60px_rgba(33,24,10,0.08)] sm:p-10'>
        <p className='text-sm font-bold text-[#a36d1b]'>Last updated: June 1, 2026</p>
        <h1 className='mt-3 text-4xl font-extrabold text-[#101828]'>Terms of Service</h1>
        <p className='mt-4 text-sm leading-6 text-[#667085]'>
          These terms describe how Kingdom Marketplace accounts, services, hiring, messaging, reviews, and moderation work during public beta.
        </p>
        <div className='mt-8 divide-y divide-[#eadfce]'>
          {sections.map(([title, body], index) => (
            <section key={title} className='py-5 first:pt-0 last:pb-0'>
              <h2 className='text-lg font-extrabold'>{index + 1}. {title}</h2>
              <p className='mt-2 text-sm leading-6 text-[#5b6472]'>{body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
