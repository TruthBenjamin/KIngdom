import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/shared/header'
import { Footer } from '@/components/shared/footer'
import { CookieConsentBanner } from '@/components/shared/cookie-consent'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Kingdom Marketplace | Faith-Centered Services',
  description: 'Connect with Christian creatives, freelancers, and professionals for your ministry and business needs.',
  keywords: ['marketplace', 'freelance', 'Christian', 'services', 'creatives'],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-icon.png', type: 'image/png', sizes: '180x180' }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en'>
      <body>
        <div className='flex min-h-screen flex-col'>
          <Header />
          <main className='flex-1'>{children}</main>
          <Footer />
        </div>
        <CookieConsentBanner />
        <Toaster position='bottom-right' />
      </body>
    </html>
  )
}
