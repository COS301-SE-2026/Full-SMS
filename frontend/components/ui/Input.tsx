import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  helperText?: string
  error?: string
  leftIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, leftIcon, id, ...props }, ref) => {
    const inputId = id ?? React.useId()

    return (
      <div className="flex flex-col gap-1 w-full">
        <label htmlFor={inputId} className="text-base font-medium text-foreground">
          {label}
        </label>

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 w-5 h-5 text-foreground/50 pointer-events-none" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full min-h-[44px] px-3 py-2 rounded',
              'bg-card border border-border',
              'text-base text-foreground placeholder:text-foreground/40',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              leftIcon && 'pl-10',
              error && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            aria-invalid={!!error}
            {...props}
          />
        </div>

        {helperText && !error && (
          <p className="text-sm text-foreground/60">{helperText}</p>
        )}
        {error && (
          <p className="text-sm text-destructive" role="alert">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
