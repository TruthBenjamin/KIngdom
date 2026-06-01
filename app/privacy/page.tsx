const sections = [
  ['Information we collect', 'We collect account details, role selection, profile information, uploaded media URLs, service listings, saved services, orders, reviews, messages, notifications, and support or moderation reports.'],
  ['How we use it', 'We use this information to operate accounts, show listings, connect buyers and sellers, support hiring workflows, deliver notifications, process reviews, and protect the marketplace from abuse.'],
  ['Media and messages', 'Profile photos, listing media, message attachments, and delivery files may be stored with our platform providers and shown to users involved in the relevant marketplace workflow.'],
  ['Trust and safety', 'We may process seller verification notes, service review decisions, abuse reports, risk signals, admin audit logs, and moderation notes to keep the marketplace safe.'],
  ['Payments and beta records', 'When payment features are enabled, we may store order, fee, wallet, withdrawal, dispute, refund placeholder, and manual adjustment records.'],
  ['Your choices', 'You can update profile details in your dashboard, request review of moderation decisions, and contact us about account or data questions.'],
  ['Security', 'We use reasonable safeguards, but no online service can guarantee perfect security. Keep your password private and report suspicious account activity.'],
]

export default function Privacy() {
  return (
    <div className='bg-[#f7f3ec] px-4 py-8 sm:px-6 sm:py-12'>
      <div className='mx-auto max-w-4xl rounded-lg border border-[#eadfce] bg-white p-6 shadow-[0_18px_60px_rgba(33,24,10,0.08)] sm:p-10'>
        <p className='text-sm font-bold text-[#a36d1b]'>Last updated: June 1, 2026</p>
        <h1 className='mt-3 text-4xl font-extrabold text-[#101828]'>Privacy Policy</h1>
        <p className='mt-4 text-sm leading-6 text-[#667085]'>
          This policy explains the data Kingdom Marketplace uses to support account creation, buyer and seller workflows, listings, messages, orders, reviews, and moderation.
        </p>
        <div className='mt-8 grid gap-4'>
          {sections.map(([title, body]) => (
            <section key={title} className='rounded-lg border border-[#eadfce] bg-[#fffdf8] p-5'>
              <h2 className='font-extrabold'>{title}</h2>
              <p className='mt-2 text-sm leading-6 text-[#5b6472]'>{body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
