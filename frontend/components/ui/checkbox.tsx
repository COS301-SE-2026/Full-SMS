import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps {
  label?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  id?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, checked, onCheckedChange, id}, ref) => {
    const checkboxId = id ?? React.useId()
    const internalRef = React.useRef<HTMLInputElement>(null)

    React.useImperativeHandle(
        ref, 
        () => internalRef.current as HTMLInputElement
    )

    return (
        <div className={cn('flex items-center gap-2')}>
            <input ref={internalRef} id={checkboxId} type='checkbox' checked={checked} onChange={(e) => onCheckedChange(e.target.checked)}
                className={cn(
                    "h-4 w-4 shrink-0 rounded border-border bg-card accent-primary cursor-pointer",
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                 )}
            />
 

        {label && (
            <label htmlFor={checkboxId} className='text-base font-medium text-foreground cursor-pointer'>
                {label}
            </label>
        )}
    </div>
    )
  })
Checkbox.displayName = "Checkbox"