import * as React from 'react'
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
      <img
        src={src}
        alt={alt}
        className='h-full w-full object-cover'
      />
    )}
    {!src && fallback && (
      <span className='text-sm font-semibold'>{fallback}</span>
    )}
  </div>
))
Avatar.displayName = 'Avatar'

export { Avatar }
