import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ToggleProps {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  helperText?: string
  disabled?: boolean
  className?: string
  id?: string
}

export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ label, checked, onCheckedChange, helperText, disabled, className, id }, ref) => {
    const toggleId = id ?? React.useId()

    return (
      <div className={cn('flex items-center gap-3', className)}>
        <button
          ref={ref}
          id={toggleId}
          role="switch"
          type="button"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onCheckedChange(!checked)}
          className={cn(
            'relative inline-flex shrink-0 h-6 w-11 rounded-full border-2 border-transparent',
            'transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            checked ? 'bg-primary' : 'bg-border'
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none inline-block h-4 w-4 mt-0.5 rounded-full bg-background shadow',
              'transform transition-transform duration-200',
              checked ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>

        <div className="flex flex-col">
          <label htmlFor={toggleId} className="text-base font-medium text-foreground cursor-pointer">
            {label}
          </label>
          {helperText && (
            <p className="text-sm text-foreground/60">{helperText}</p>
          )}
        </div>
      </div>
    )
  }
)
Toggle.displayName = 'Toggle'
