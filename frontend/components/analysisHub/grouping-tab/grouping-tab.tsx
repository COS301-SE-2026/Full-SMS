import React, { useState } from 'react'
import GroupingToolbar from './grouping-toolbar'
import GroupingCharts from './grouping-charts'
import { useComments } from '@/hooks/useComments'
import { CommentPanel } from '../comments/CommentPanel'
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext'
import { useMemberLookup } from '@/hooks/useMemberLookup'
import { useCommentSubmit } from '@/hooks/useCommentSubmit'


export default function GroupingTab() {
  const [commentsOpen, setCommentsOpen] = useState(false)
    const { currentWorkspaceId, currentUpload} = useHdf5Data();
  const memberLookup = useMemberLookup(currentWorkspaceId)
  const { comments, loading: commentsLoading, error: commentsError, fetchComments,} = useComments(currentWorkspaceId, currentUpload, "grouping")
  const addComment = useCommentSubmit(currentWorkspaceId, currentUpload, "grouping", fetchComments)

  return (
    <div>
      <GroupingToolbar
      commentsOpen={commentsOpen}
      onToggleComments={() => setCommentsOpen((v) => !v)}
      onAddComment={addComment}/>

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
