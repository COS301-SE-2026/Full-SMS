import React from 'react'
import LifetimeToolbar from './lifetime-toolbar'
import LifetimeCharts from './lifetime-charts'
import { useHistory } from '@/hooks/useHistory'
import { HistoryPanel } from '../history/HistoryPanel'
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext'

export default function LifetimeTab() {
  const{ currentWorkspaceId, currentUpload, currentMeasurement} = useHdf5Data()
  const {entries, loading, error, fetchHistory}= useHistory(currentWorkspaceId, currentUpload, "lifetime")


  return (
    <div className='w-full h-full'>
        <LifetimeToolbar/>
        <LifetimeCharts/>
    </div>
  )
}
