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
import { NewCommentInput } from '../comments/CommentToolbar'
import { useMemberLookup } from '@/hooks/useMemberLookup'
import { useCommentSubmit } from '@/hooks/useCommentSubmit'

export default function LifetimeTab() {
  const{ currentWorkspaceId, currentUpload, currentMeasurement, members} = useHdf5Data()
  const {entries, loading, error, fetchHistory}= useHistory(currentWorkspaceId, currentUpload, "lifetime")
  const { decayCounts, decayTimes, setFitResult} = useAnalysisTab()
  const [historyOpen, setHistoryOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [newCommentOpen, setNewCommentOpen] = useState(false)
  const memberLookup = useMemberLookup(currentWorkspaceId)
  const { comments, loading: commentsLoading, error: commentsError, fetchComments} = useComments(currentWorkspaceId, currentUpload, "lifetime", currentMeasurement)
  const addComment = useCommentSubmit(currentWorkspaceId, currentUpload, "lifetime", fetchComments, currentMeasurement)

  return (
    <div className='w-full h-full flex gap-3'>
      <div className='flex flex-col flex-1'>
        <LifetimeToolbar 
        historyOpen={historyOpen}
        onToggleHistory={() => setHistoryOpen((v) => !v)}
        commentsOpen={commentsOpen}
        onToggleComments={() => setCommentsOpen((v) => !v)}
        onNewComment={() => setNewCommentOpen((v) => !v)}
        commentCount={comments.length}/>

        <NewCommentInput
          open={newCommentOpen}
          onSubmit={addComment}
          onClose={() => setNewCommentOpen(false)}/>

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
