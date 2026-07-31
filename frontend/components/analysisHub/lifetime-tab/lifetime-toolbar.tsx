'use client'

import { Button, Toggle } from '@/components/ui'
import { useAnalysisTab } from '@/contexts/analysisTabsContext/AnalysisTabsContext'
import React, { useState } from 'react'



export default function LifetimeToolbar() {
    const [showIRF, setShowIRF] = useState<boolean>(true)
    const {setFittingDialogOpen, useLogScale, setUseLogScale, fitResult} = useAnalysisTab()

  return (
    <div className="flex flex-col gap-4 h-12 px-4 border-b border-border bg-background mb-4 h-fit">
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
          <Button variant='primary' className=' min-h-[28px] px-10' onClick={()=>setFittingDialogOpen(true)}>
              Fit... 
          </Button>
      </div>
        {
          useLogScale && (
            <div className='items-center flex flex-row gap-16'>
              <p>Fit Result:</p>
              <p className='text-primary text-sm'>tau = {fitResult?.tau}</p>
              <p className='text-warning text-sm'> chi<sup>2</sup>: {fitResult?.chi_squared}</p>
              <p className='text-warning text-sm'> DW = {fitResult?.durbin_watson}</p>
            </div>
          )
        }
    </div>
  )
}
