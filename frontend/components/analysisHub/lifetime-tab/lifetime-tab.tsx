import React from 'react'
import LifetimeToolbar from './lifetime-toolbar'
import LifetimeCharts from './lifetime-charts'
import { useHistory } from '@/hooks/useHistory'
import { HistoryPanel } from '../history/HistoryPanel'
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext'
import { useAnalysisTab } from '@/contexts/analysisTabsContext/AnalysisTabsContext'
import { getLifetimeData } from '@/services/analysisServices'
import { upload } from '@testing-library/user-event/dist/cjs/utility/upload.js'
import { historyService } from '@/services/historyServices'

export default function LifetimeTab() {
  const{ currentWorkspaceId, currentUpload, currentMeasurement} = useHdf5Data()
  const {entries, loading, error, fetchHistory}= useHistory(currentWorkspaceId, currentUpload, "lifetime")
  const { decayCounts, decayTimes, setFitResult} = useAnalysisTab()

  return (
    <div className='w-full h-full flex gap-3'>
      <div className='flex flex-col flex-1'>
        <LifetimeToolbar/>
        <LifetimeCharts/>
      </div>

      <HistoryPanel
        entries={entries}
        loading={loading}
        error={error}
        onRevert={async (entry) => {
          const response = await getLifetimeData({
            ...entry.old_value,
            upload_id: currentUpload,
            measurement_id: currentMeasurement,
            times: decayTimes,
            counts: decayCounts,
          })
          setFitResult(response)

          await historyService.revertEntry(
            currentWorkspaceId!,
            entry.id
          )

          fetchHistory()
        }}
      />
    </div>
  )
}
