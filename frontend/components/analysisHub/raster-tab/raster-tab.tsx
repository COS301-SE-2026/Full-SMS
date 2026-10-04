import React, { useState} from 'react'
import RasterToolbar from './raster-toolbar'
import { RasterHeatmap } from './rater-heatmap'
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext'
import { useHistory } from '@/hooks/useHistory'
import { HistoryPanel } from '../history/HistoryPanel'
import { historyService } from '@/services/historyServices'
import { useComments } from '@/hooks/useComments'
import { CommentPanel } from '../comments/CommentPanel'
import { NewCommentInput } from '../comments/CommentToolbar'
import { useMemberLookup } from '@/hooks/useMemberLookup'
import { useCommentSubmit } from '@/hooks/useCommentSubmit'

export default function RasterTab() {
  const {currentWorkspaceId, currentUpload, currentMeasurement, setHeatMapColor, members} = useHdf5Data()
  const {entries, loading, error, fetchHistory} = useHistory(currentWorkspaceId, currentUpload, "raster")
  const [historyOpen, setHistoryOpen] = useState(false)

  const [commentsOpen, setCommentsOpen] = useState(false)
  const [newCommentOpen, setNewCommentOpen] = useState(false)
  const memberLookup = useMemberLookup(currentWorkspaceId)
  const { comments, loading: commentsLoading, error: commentsError, fetchComments } =
    useComments(currentWorkspaceId, currentUpload, "raster", currentMeasurement)
  const addNote = useCommentSubmit(currentWorkspaceId, currentUpload, "raster", fetchComments, currentMeasurement)

  return (
    <div className='h-full w-full flex gap-3'>
      <div className='flex flex-col flex-1'>
        <RasterToolbar 
        commentsOpen={commentsOpen}
        onToggleComments={() => setCommentsOpen((v) => !v)}
        onNewComment={() => setNewCommentOpen((v) => !v)}
        commentCount={comments.length}
        onHistoryRecorded={fetchHistory} historyOpen={historyOpen} onToggleHistory={() => setHistoryOpen((v) => !v)}/>
        <NewCommentInput
        open={newCommentOpen}
        onSubmit={addNote}
        onClose={() => setNewCommentOpen(false)}/>
        <RasterHeatmap
        comments={comments}
        onAddComment={addNote}/>
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

      {commentsOpen && (
        <CommentPanel
          comments={comments}
        loading={commentsLoading}
        error={commentsError}
        authorFinder={memberLookup}
       />
      )}
  </div>
  )
}
