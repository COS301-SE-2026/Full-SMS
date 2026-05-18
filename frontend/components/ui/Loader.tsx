import * as React from 'react'
import { cn } from '@/lib/utils'

export interface LoaderProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg'
  /** Optional label for screen readers */
  label?: string
  /** Centers the loader in its container */
  centered?: boolean
  className?: string
}

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-7 h-7 border-2',
  lg: 'w-11 h-11 border-[3px]',
}

export const Loader = ({ size = 'md', label = 'Loading...', centered, className }: LoaderProps) => (
  <div
    className={cn(
      'inline-flex items-center justify-center',
      centered && 'w-full h-full min-h-[200px]',
      className
    )}
    role="status"
    aria-label={label}
  >
    <div
      className={cn(
        'rounded-full border-foreground/20 border-t-primary animate-spin',
        sizes[size]
      )}
    />
  </div>
)

Loader.displayName = 'Loader'