import React, {useState} from 'react'
import LifetimeToolbar from './lifetime-toolbar'
import LifetimeCharts from './lifetime-charts'
import { useHistory } from '@/hooks/useHistory'
import { HistoryPanel } from '../history/HistoryPanel'
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext'
import { useAnalysisTab } from '@/contexts/analysisTabsContext/AnalysisTabsContext'
import { getLifetimeData } from '@/services/analysisServices'
import { historyService } from '@/services/historyServices'
import { useComments } from '@/hooks/useComments'
import { CommentPanel } from '../comments/CommentPanel'
import { commentService } from '@/services/commentServices'
import { useToast } from '@/contexts/toastContext/ToastContext'
import { useMemberLookup } from '@/hooks/useMemberLookup'

export default function LifetimeTab() {
  const{ currentWorkspaceId, currentUpload, currentMeasurement, members} = useHdf5Data()
  const {entries, loading, error, fetchHistory}= useHistory(currentWorkspaceId, currentUpload, "lifetime")
  const { decayCounts, decayTimes, setFitResult} = useAnalysisTab()
  const [historyOpen, setHistoryOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const memberLookup = useMemberLookup(currentWorkspaceId)
  const { comments, loading: commentsLoading, error: commentsError, fetchComments} = useComments(currentWorkspaceId, currentUpload, "lifetime")
  const { successToast, errorToast} = useToast();

  const addComment = async (payload: {content: string; anchor_x: number; anchor_y: number})=> {
    if(!currentWorkspaceId || !currentUpload) return
    try{
      await commentService.addComment(currentWorkspaceId, {
        content: payload.content,
        anchor_x: payload.anchor_x,
        anchor_y: payload.anchor_y,
        upload_id: currentUpload,
        tab: "lifetime",
      })
      fetchComments()
      successToast("Comment has been added successfully")
    } catch(error: any){
      console.error("Failed to add comment", error)
      errorToast("Failed to add comment")
  }
}

  return (
    <div className='w-full h-full flex gap-3'>
      <div className='flex flex-col flex-1'>
        <LifetimeToolbar 
        historyOpen={historyOpen}
        onToggleHistory={() => setHistoryOpen((v) => !v)}
        commentsOpen={commentsOpen}
        onToggleComments={() => setCommentsOpen((v) => !v)}/>

        <LifetimeCharts
          comments={comments}
          onAddComment={addComment}/>
      </div>

      {historyOpen && (<HistoryPanel
        entries={entries}
        loading={loading}
        error={error}
        members={members}
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
      )}

       {commentsOpen && (
      <CommentPanel
      comments={comments}
      loading={commentsLoading}
      error={commentsError}
      authorFinder={memberLookup} />
    )}
    </div>

   
  )
}
