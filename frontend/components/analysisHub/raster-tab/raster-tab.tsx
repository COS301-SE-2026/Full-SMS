import React, { useState, useEffect} from 'react'
import RasterToolbar from './raster-toolbar'
import { RasterHeatmap } from './rater-heatmap'
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext'
import { useHistory } from '@/hooks/useHistory'
import { HistoryPanel } from '../history/HistoryPanel'
import { historyService } from '@/services/historyServices'
import { useComments } from '@/hooks/useComments'
import { CommentPanel } from '../comments/CommentPanel'
import { workspaceService } from '@/services/workspaceServices'
import { commentService } from '@/services/commentServices'
import { WorkspaceMemberProfile } from '@/types/workspace'
import { useToast } from '@/contexts/toastContext/ToastContext'

export default function RasterTab() {
  const {currentWorkspaceId, currentUpload, setHeatMapColor} = useHdf5Data()
  const {entries, loading, error, fetchHistory} = useHistory(currentWorkspaceId, currentUpload, "raster")
  const [historyOpen, setHistoryOpen] = useState(false)

  const [commentsOpen, setCommentsOpen] = useState(false)
  const [memberLookup, setMemberLookup] = useState<Record<string, WorkspaceMemberProfile>>({})
  const { comments, loading: commentsLoading, error: commentsError, fetchComments } =
    useComments(currentWorkspaceId, currentUpload, "raster")
  const { successToast, errorToast } = useToast()

  const addNote = async (payload: { content: string; anchorX: number; anchorY: number }) => {
    if (!currentWorkspaceId || !currentUpload) return
    try {
      await commentService.addComment(currentWorkspaceId, {
        content: payload.content,
        anchor_x: payload.anchorX,
        anchor_y: payload.anchorY,
        upload_id: currentUpload,
        tab: "raster",
      })
      fetchComments()
      successToast("Comment has been added successfully")
    } catch (err: any) {
      errorToast(err.message || "Failed to add comment")
    }
  }

  useEffect(() => {
    if (!currentWorkspaceId) return
    let stopped = false

    workspaceService.getWorkspaceMembers(currentWorkspaceId)
      .then((res) => {
        if (stopped) return
        const lookup: Record<string, WorkspaceMemberProfile> = {}
        for (const member of res.members) {
          lookup[member.id] = member
        }
        setMemberLookup(lookup)
      })
      .catch(() => {
        if (!stopped) setMemberLookup({})
      })

    return () => { stopped = true }
  }, [currentWorkspaceId])


  return (
    <div className='h-full w-full flex gap-3'>
      <div className='flex flex-col flex-1'>
        <RasterToolbar 
        commentsOpen={commentsOpen}
        onToggleComments={() => setCommentsOpen((v) => !v)}
        onHistoryRecorded={fetchHistory} historyOpen={historyOpen} onToggleHistory={() => setHistoryOpen((v) => !v)}/>
        <RasterHeatmap 
        comments={comments}
        onAddComment={addNote}/>
      </div>
      {historyOpen &&(
      <HistoryPanel
        entries={entries}
        loading={loading}
        error={error}
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
