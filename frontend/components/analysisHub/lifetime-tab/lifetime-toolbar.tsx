'use client'

import { Button, Toggle } from '@/components/ui'
import { useAnalysisTab } from '@/contexts/analysisTabsContext/AnalysisTabsContext'
import React, { useState } from 'react'
import { History } from 'lucide-react'



export default function LifetimeToolbar({historyOpen, onToggleHistory}: {historyOpen:boolean; onToggleHistory: () => void}) {
    const {setFittingDialogOpen, useLogScale, setUseLogScale, fitResult, showIRF, setShowIRF} = useAnalysisTab()

  return (
    <div className="flex flex-col gap-4 h-12 px-4 border-b border-border bg-background mb-4 h-fit pb-2">
      <div className='flex flex-row gap-4 items-center'>
        <h3 className="text-foreground">Lifetime Analysis</h3>
          <Toggle
          label="Use log scale"
          checked={useLogScale}
          onCheckedChange={setUseLogScale}
          />
          <Toggle
          label="Show IRF"
          checked={showIRF}
          onCheckedChange={setShowIRF}
          />
          <Button variant='primary'  size={"sm"} onClick={()=>setFittingDialogOpen(true)}>
              Fit... 
          </Button>

          <Button variant="ghost" size="sm" 
            title="View Parameter history"
            onClick={onToggleHistory}
            className={`ml-auto px-2 py-0.5 min-h-0 ${historyOpen ? "bg-card" : ""}`}
            leftIcon={<History size={14} />}
          />
      </div>
        {
          fitResult && (
            <div className='items-center flex flex-row gap-8'>
              <p className='text-muted text-sm'>Fit Result:</p>
              <p className='text-primary text-sm'>
                tau = {Array.isArray(fitResult.tau) 
                  ? fitResult.tau.map(t => t.toFixed(2)).join(', ') + ' ns'
                  : Number(fitResult.tau).toFixed(2) + ' ns'}
              </p>
              <p className='text-warning text-sm'>chi<sup>2</sup>: {fitResult.chi_squared.toFixed(3)}</p>
              <p className='text-warning text-sm'>DW = {fitResult.durbin_watson.toFixed(2)}</p>
            </div>
          )
        }
    </div>
  )
}
