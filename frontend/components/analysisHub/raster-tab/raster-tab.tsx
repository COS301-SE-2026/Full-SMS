import React from 'react'
import RasterToolbar from './raster-toolbar'
import { RasterHeatmap } from './rater-heatmap'
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext'
import { useHistory } from '@/hooks/useHistory'
import { HistoryPanel } from '../history/HistoryPanel'
import { historyService } from '@/services/historyServices'

export default function RasterTab() {
  const {currentWorkspaceId, currentUpload, setHeatMapColor} = useHdf5Data()
  const {entries, loading, error, fetchHistory} = useHistory(currentWorkspaceId, currentUpload, "raster")
  return (
    <div className='h-full w-full flex gap-3'>
      <div className='flex flex-col flex-1'>
        <RasterToolbar/>
        <RasterHeatmap/>
      </div>
      <HistoryPanel
        entries={entries}
        loading={loading}
        error={error}
        onRevert={(entry) => {
          setHeatMapColor(entry.old_value)
          historyService.revertEntry(currentWorkspaceId!, entry.id).then(fetchHistory);
        }}
      />
  </div>
  )
}
