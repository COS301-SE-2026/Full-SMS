import * as React from 'react'
import { cn } from '@/lib/utils'
import { Loader } from './Loader'

export interface ChartLoadingOverlayProps {
  /** Whether the chart's data is being (re)loaded */
  loading: boolean
  label?: string
  className?: string
}


export const ChartLoadingOverlay = ({
  loading,
  label = 'Loading…',
  className,
}: ChartLoadingOverlayProps) => {
  if (!loading) return null

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-10 rounded-[inherit] bg-card/40 animate-chart-loading-in',
        className
      )}
      aria-busy="true"
    >
      <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden rounded-t-[inherit]">
        <div className="h-full w-full bg-primary/70 animate-pulse" />
      </div>
      <div className="absolute right-3 top-3 flex items-center rounded bg-card/80 px-2 py-1 text-xs text-foreground/70">
        <Loader size="sm" label={label} />
      </div>
    </div>
  )
}

ChartLoadingOverlay.displayName = 'ChartLoadingOverlay'
