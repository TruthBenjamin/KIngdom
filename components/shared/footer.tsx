import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className='border-t border-[#eadfce] bg-[#fffdf8]'>
      <div className='container mx-auto px-4 py-12'>
        <div className='mb-8 grid grid-cols-1 gap-8 md:grid-cols-4'>
          <div>
            <div className='mb-4 flex items-center space-x-2'>
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-[#101828] font-serif font-bold text-[#edbd68]'>
                K
              </div>
              <span className='font-extrabold tracking-[0.08em]'>KINGDOM</span>
            </div>
            <p className='text-sm text-muted-foreground'>
              Faith-centered marketplace for Christian creatives and professionals.
            </p>
          </div>

          <div>
            <h4 className='mb-4 text-sm font-semibold'>Platform</h4>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li>
                <Link href='/marketplace' className='transition-colors hover:text-foreground'>
                  Browse
                </Link>
              </li>
              <li>
                <Link href='/how-it-works' className='transition-colors hover:text-foreground'>
                  How It Works
                </Link>
              </li>
              <li>
                <Link href='/marketplace/brand-design' className='transition-colors hover:text-foreground'>
                  Brand Design
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className='mb-4 text-sm font-semibold'>Company</h4>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li>
                <Link href='/about' className='transition-colors hover:text-foreground'>
                  About
                </Link>
              </li>
              <li>
                <Link href='/contact' className='transition-colors hover:text-foreground'>
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className='mb-4 text-sm font-semibold'>Legal</h4>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li>
                <Link href='/privacy' className='transition-colors hover:text-foreground'>
                  Privacy
                </Link>
              </li>
              <li>
                <Link href='/terms' className='transition-colors hover:text-foreground'>
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className='border-t border-[#eadfce] pt-8'>
          <p className='text-center text-sm text-muted-foreground'>
            &copy; {currentYear} Kingdom Marketplace. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
