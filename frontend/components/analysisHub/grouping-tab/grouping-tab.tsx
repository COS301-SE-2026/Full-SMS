import React, { useState } from 'react'
import GroupingToolbar from './grouping-toolbar'
import GroupingCharts from './grouping-charts'
import { useComments } from '@/hooks/useComments'
import { CommentPanel } from '../comments/CommentPanel'
import { commentService } from '@/services/commentServices'
import { useToast } from '@/contexts/toastContext/ToastContext'
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext'
import { useMemberLookup } from '@/hooks/useMemberLookup'


export default function GroupingTab() {
  const [commentsOpen, setCommentsOpen] = useState(false)
    const { currentWorkspaceId, currentUpload} = useHdf5Data();
  const memberLookup = useMemberLookup(currentWorkspaceId)
  const { comments, loading: commentsLoading, error: commentsError, fetchComments,} = useComments(currentWorkspaceId, currentUpload, "grouping")
  const { successToast, errorToast} = useToast();
  
  const addComment = async (payload: {content: string;})=> {
      if(!currentWorkspaceId || !currentUpload) return
      try{
        await commentService.addComment(currentWorkspaceId, {
          content: payload.content,
          upload_id: currentUpload,
          tab: "grouping",
        })
        fetchComments()
        successToast("Comment has been added successfully")
      } catch(error: any){
        console.error("Failed to add comment", error)
        errorToast("Failed to add comment")
    }
  }

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
