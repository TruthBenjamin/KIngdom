import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className='border-t border-border bg-muted/50'>
      <div className='container mx-auto px-4 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8 mb-8'>
          <div>
            <div className='flex items-center space-x-2 mb-4'>
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold'>
                K
              </div>
              <span className='font-semibold'>Kingdom</span>
            </div>
            <p className='text-sm text-muted-foreground'>
              Faith-centered marketplace for Christian creatives and professionals.
            </p>
          </div>

          <div>
            <h4 className='font-semibold mb-4 text-sm'>Platform</h4>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li>
                <Link href='/marketplace' className='hover:text-foreground transition-colors'>
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href='/how-it-works' className='hover:text-foreground transition-colors'>
                  How It Works
                </Link>
              </li>
              <li>
                <Link href='/categories' className='hover:text-foreground transition-colors'>
                  Categories
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className='font-semibold mb-4 text-sm'>Company</h4>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li>
                <Link href='/about' className='hover:text-foreground transition-colors'>
                  About
                </Link>
              </li>
              <li>
                <Link href='/contact' className='hover:text-foreground transition-colors'>
                  Contact
                </Link>
              </li>
              <li>
                <Link href='/blog' className='hover:text-foreground transition-colors'>
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className='font-semibold mb-4 text-sm'>Legal</h4>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li>
                <Link href='/privacy' className='hover:text-foreground transition-colors'>
                  Privacy
                </Link>
              </li>
              <li>
                <Link href='/terms' className='hover:text-foreground transition-colors'>
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className='border-t border-border pt-8'>
          <p className='text-sm text-muted-foreground text-center'>
            © {currentYear} Kingdom Marketplace. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
