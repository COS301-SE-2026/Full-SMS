'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  className?: string
  children: React.ReactNode
}

export function Modal({ open, onClose, title, className ,children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto p-4">
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className={cn(
          "relative w-fit max-w-[100vw] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl bg-card border border-border shadow-xl", className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <div className="px-6 pt-5 pb-3 text-lg font-semibold text-foreground">{title}</div>}
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>,
    document.body
  )
}