import * as React from 'react'

export interface CheckboxProps {
  label?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function Checkbox
  ({ label, checked, onCheckedChange}:CheckboxProps){

    return (
        <label>
            <input type='checkbox' checked={checked} onChange={(e) => onCheckedChange(e.target.checked)}/>
            {label}
        </label>
    )
  }
