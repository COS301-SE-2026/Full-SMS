'use client'

import { Button, Toggle } from '@/components/ui'
import { useAnalysisTab } from '@/contexts/analysisTabsContext/AnalysisTabsContext'
import React, { useState } from 'react'



export default function LifetimeToolbar() {
    const [useLogScale, setUseLogScale ] = useState<boolean>(true)
    const [showIRF, setShowIRF] = useState<boolean>(true)
    const {setFittingDialogOpen} = useAnalysisTab()

  return (
    <div className="flex items-center gap-4 h-12 px-4 border-b border-border bg-background">
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
  )
}
