'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto">
      <div className="absolute inset-0 bg-background/80" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative mx-auto mt-16 w-[min(900px,95vw)] rounded-xl bg-[#141417] border border-[#222226] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <div className="px-6 pt-5 pb-3 text-zinc-200">{title}</div>}
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>,
    document.body
  )
}