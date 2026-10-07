import React, { useState } from 'react'
import GroupingToolbar from './grouping-toolbar'
import GroupingCharts from './grouping-charts'
import { useComments } from '@/hooks/useComments'
import { CommentPanel } from '../comments/CommentPanel'
import { NewCommentInput } from '../comments/CommentToolbar'
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext'
import { useMemberLookup } from '@/hooks/useMemberLookup'
import { useCommentSubmit } from '@/hooks/useCommentSubmit'


export default function GroupingTab() {
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [newCommentOpen, setNewCommentOpen] = useState(false)
    const { currentWorkspaceId, currentUpload, currentMeasurement } = useHdf5Data();
  const memberLookup = useMemberLookup(currentWorkspaceId)
  const { comments, loading: commentsLoading, error: commentsError, fetchComments,} = useComments(currentWorkspaceId, currentUpload, "grouping", currentMeasurement)
  const addComment = useCommentSubmit(currentWorkspaceId, currentUpload, "grouping", fetchComments, currentMeasurement)

  return (
    <div>
      <GroupingToolbar
      commentsOpen={commentsOpen}
      onToggleComments={() => setCommentsOpen((v) => !v)}
      onNewComment={() => setNewCommentOpen((v) => !v)}
      commentCount={comments.length}/>

      <NewCommentInput
      open={newCommentOpen}
      onSubmit={addComment}
      onClose={() => setNewCommentOpen(false)}/>

      <GroupingCharts />
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
