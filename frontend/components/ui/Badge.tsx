import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded whitespace-nowrap',
  {
    variants: {
      variant: {
        default:     'bg-primary/20 text-primary border border-primary/30',
        secondary:   'bg-card text-foreground border border-border',
        outline:     'bg-transparent text-foreground border border-border',
        destructive: 'bg-destructive/20 text-destructive border border-destructive/30',
        success:     'bg-success/20 text-success border border-success/30',
        warning:     'bg-warning/20 text-warning border border-warning/30',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  )
)
Badge.displayName = 'Badge'
