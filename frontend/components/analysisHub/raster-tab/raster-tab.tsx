import React, { useState} from 'react'
import RasterToolbar from './raster-toolbar'
import { RasterHeatmap } from './rater-heatmap'
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext'
import { useHistory } from '@/hooks/useHistory'
import { HistoryPanel } from '../history/HistoryPanel'
import { historyService } from '@/services/historyServices'

export default function RasterTab() {
  const {currentWorkspaceId, currentUpload, setHeatMapColor, members} = useHdf5Data()
  const {entries, loading, error, fetchHistory} = useHistory(currentWorkspaceId, currentUpload, "raster")
  const [historyOpen, setHistoryOpen] = useState(false)
  return (
    <div className='h-full w-full flex gap-3'>
      <div className='flex flex-col flex-1'>
        <RasterToolbar onHistoryRecorded={fetchHistory} historyOpen={historyOpen} onToggleHistory={() => setHistoryOpen((v) => !v)}/>
        <RasterHeatmap/>
      </div>
      {historyOpen &&(
      <HistoryPanel
        entries={entries}
        loading={loading}
        error={error}
        members={members}
        onRevert={(entry) => {
          setHeatMapColor(entry.old_value)
          historyService.revertEntry(currentWorkspaceId!, entry.id).then(fetchHistory);
        }}
      />
      )}
  </div>
  )
}
