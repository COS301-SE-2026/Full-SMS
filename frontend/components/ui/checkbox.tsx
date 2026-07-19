import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps 
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'>{
  label?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  indeterminate?: boolean 
  helperText?: string
  disabled?: boolean
  className?:string
  id?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, checked, onCheckedChange, id, indeterminate, helperText, disabled, className, ...props }, ref) => {
    const checkboxId = id ?? React.useId()
    const internalRef = React.useRef<HTMLInputElement>(null)

    React.useImperativeHandle(
        ref, 
        () => internalRef.current as HTMLInputElement
    )

    React.useEffect(() => {
        if (internalRef.current){
            internalRef.current.indeterminate = !!indeterminate
        }
    }, [indeterminate])

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <input ref={internalRef} id={checkboxId} type='checkbox' checked={checked} disabled={disabled} onChange={(e) => onCheckedChange(e.target.checked)}
                className={cn(
                    "h-4 w-4 shrink-0 rounded border border-border bg-card accent-primary cursor-pointer",
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    "disabled:opacity-40 disabled:cursor-not-allowed"
                 )}
                 {...props}
            />
 

        {label && (
            <div className="flex flex-col">
            <label htmlFor={checkboxId} className='text-base font-medium text-foreground cursor-pointer'>
                {label}
            </label>
            {helperText && (
                <p className='text-sm text-foreground/60'>
                    {helperText}
                </p>
            )}
            </div>
        )}
    </div>
    )
  })
Checkbox.displayName = "Checkbox"