import IrfManagement from '@/components/analysisHub/irf-management/irf-management'
import Sidebar from '@/components/dashboard/Sidebar'
import React from 'react'



export default function IrfManagementPage() {
  return (
    <div className="flex h-screen bg-background text-foreground">
        <Sidebar activeItem="workspaces" />
        <IrfManagement/>
    </div>
  )
}