import Link from 'next/link'
import Image from 'next/image'
import { marketplaceCategoryHref } from '@/lib/navigation'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className='border-t border-[#0b2442] bg-[#06172f] text-white'>
      <div className='container mx-auto px-4 py-12'>
        <div className='mb-8 grid grid-cols-1 gap-8 md:grid-cols-4'>
          <div>
            <div className='mb-4 flex items-center space-x-2'>
              <Image
                src='/images/kingdom-marketplace-logo.jpg'
                alt='Kingdom Marketplace'
                width={48}
                height={48}
                className='h-12 w-12 rounded-md border border-[#f0c56a] bg-[#0b2442] object-cover shadow-[0_0_0_1px_rgba(240,197,106,0.18)]'
              />
              <span className='font-extrabold tracking-[0.08em] text-white'>KINGDOM</span>
            </div>
            <p className='text-sm text-white/66'>
              Faith-centered marketplace for Christian creatives and professionals.
            </p>
          </div>

          <div>
            <h4 className='mb-4 text-sm font-semibold text-white'>Platform</h4>
            <ul className='space-y-2 text-sm text-white/66'>
              <li>
                <Link href='/marketplace' className='transition-colors hover:text-[#f0c56a]'>
                  Browse
                </Link>
              </li>
              <li>
                <Link href='/how-it-works' className='transition-colors hover:text-[#f0c56a]'>
                  How It Works
                </Link>
              </li>
              <li>
                <Link href={marketplaceCategoryHref('brand-design')} className='transition-colors hover:text-[#f0c56a]'>
                  Brand Design
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className='mb-4 text-sm font-semibold text-white'>Company</h4>
            <ul className='space-y-2 text-sm text-white/66'>
              <li>
                <Link href='/about' className='transition-colors hover:text-[#f0c56a]'>
                  About
                </Link>
              </li>
              <li>
                <Link href='/contact' className='transition-colors hover:text-[#f0c56a]'>
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className='mb-4 text-sm font-semibold text-white'>Legal</h4>
            <ul className='space-y-2 text-sm text-white/66'>
              <li>
                <Link href='/privacy' className='transition-colors hover:text-[#f0c56a]'>
                  Privacy
                </Link>
              </li>
              <li>
                <Link href='/terms' className='transition-colors hover:text-[#f0c56a]'>
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className='border-t border-white/10 pt-8'>
          <p className='text-center text-sm text-white/60'>
            &copy; {currentYear} Kingdom Marketplace. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
