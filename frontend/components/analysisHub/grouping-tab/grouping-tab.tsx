import React, { useState, useEffect } from 'react'
import GroupingToolbar from './grouping-toolbar'
import GroupingCharts from './grouping-charts'
import { WorkspaceMemberProfile } from '@/types/workspace'
import { useComments } from '@/hooks/useComments'
import { CommentPanel } from '../comments/CommentPanel'
import { workspaceService } from '@/services/workspaceServices'
import { commentService } from '@/services/commentServices'
import { useToast } from '@/contexts/toastContext/ToastContext'
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext'


export default function GroupingTab() {
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [memberLookup, setMemberLookup] = useState<Record<string, WorkspaceMemberProfile>>({})
    const { currentWorkspaceId, currentUpload} = useHdf5Data();
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
