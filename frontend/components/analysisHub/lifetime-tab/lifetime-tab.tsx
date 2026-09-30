import React, {useEffect, useState} from 'react'
import LifetimeToolbar from './lifetime-toolbar'
import LifetimeCharts from './lifetime-charts'
import { useHistory } from '@/hooks/useHistory'
import { HistoryPanel } from '../history/HistoryPanel'
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext'
import { useAnalysisTab } from '@/contexts/analysisTabsContext/AnalysisTabsContext'
import { getLifetimeData } from '@/services/analysisServices'
import { upload } from '@testing-library/user-event/dist/cjs/utility/upload.js'
import { historyService } from '@/services/historyServices'
import { useComments } from '@/hooks/useComments'
import { CommentPanel } from '../comments/CommentPanel'
import { workspaceService } from '@/services/workspaceServices'
import { WorkspaceMemberProfile } from '@/types/workspace'
import { commentService } from '@/services/commentServices'
import { useToast } from '@/contexts/toastContext/ToastContext'

export default function LifetimeTab() {
  const{ currentWorkspaceId, currentUpload, currentMeasurement} = useHdf5Data()
  const {entries, loading, error, fetchHistory}= useHistory(currentWorkspaceId, currentUpload, "lifetime")
  const { decayCounts, decayTimes, setFitResult} = useAnalysisTab()
  const [historyOpen, setHistoryOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [memberLookup, setMemberLookup] = useState<Record<string, WorkspaceMemberProfile>>({})
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

useEffect (() => {
  if(!currentWorkspaceId) return
  let stopped = false

  workspaceService.getWorkspaceMembers(currentWorkspaceId)
    .then((res) => {
      if(stopped) return
      const lookup: Record<string, WorkspaceMemberProfile> = {}
      for (const user of res.members){
        lookup[user.id] = user
      }
      setMemberLookup(lookup)
    })
    .catch(() => {
      if(!stopped) setMemberLookup({})
    })

    return () => { stopped = true}
}, [currentWorkspaceId])

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
