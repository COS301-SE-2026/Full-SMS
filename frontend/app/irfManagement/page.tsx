import IrfManagement from '@/components/analysisHub/irf-management/irf-management'
import Sidebar from '@/components/dashboard/Sidebar'
import React from 'react'

interface IrfManagementProps {
   readonly isDialog?: boolean
}

export default function IrfManagementPage({isDialog=false}:IrfManagementProps) {
  return (
    <div className="flex h-screen bg-background text-foreground">
        <Sidebar activeItem="workspaces" />
        <IrfManagement isDialog={isDialog}/>
    </div>
  )
}