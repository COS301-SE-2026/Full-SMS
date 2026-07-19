import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps {
  label?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function Checkbox
  ({ label, checked, onCheckedChange}:CheckboxProps){

    return (
        <div className={cn('flex items-center gap-2')}>
            <input type='checkbox' checked={checked} onChange={(e) => onCheckedChange(e.target.checked)}
                className={cn(
                    "h-4 w-4 shrink-0 rounded border-border bg-card accent-primary cursor-pointer",
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    "disabled:opacity-40 disabled:cursor-not-allowed"
                 )}
            />
 

        {label && (
        <label className='text-base font-medium text-foreground cursor-pointer'>
            {label}
        </label>
    )}
</div>
)}