import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    src?: string
    alt?: string
    fallback?: string
  }
>(({ className, src, alt, fallback, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-muted',
      className
    )}
    {...props}
  >
    {src && (
      <Image
        src={src}
        alt={alt || fallback || 'Avatar'}
        fill
        sizes='40px'
        className='object-cover'
      />
    )}
    {!src && fallback && (
      <span className='text-sm font-semibold'>{fallback}</span>
    )}
  </div>
))
Avatar.displayName = 'Avatar'

export { Avatar }
