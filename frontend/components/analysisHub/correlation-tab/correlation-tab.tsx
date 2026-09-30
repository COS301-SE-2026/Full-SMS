import React, {useState, useEffect} from "react";
import CorrelationTabToolbar from "./correlation-tab-toolbar";
import CorrelationChart from "./correlation-chart";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import { useHistory } from "@/hooks/useHistory";
import { HistoryPanel } from "../history/HistoryPanel";
import { historyService } from "@/services/historyServices";
import { useComments } from "@/hooks/useComments";
import { CommentPanel } from "../comments/CommentPanel";
import { workspaceService } from "@/services/workspaceServices";
import { commentService } from "@/services/commentServices";
import { useToast } from "@/contexts/toastContext/ToastContext";
import { WorkspaceMemberProfile } from "@/types/workspace";

function CorrelationTab() {
  const [window, setWindow] = useState<number>(450);
  const [bin, setBin] = useState<number>(0.5);
  const [offset, setOffset] = useState<number>(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { currentWorkspaceId, currentUpload, members } = useHdf5Data();
  const {entries, loading, error, fetchHistory} = useHistory(currentWorkspaceId, currentUpload, "correlation");
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [memberLookup, setMemberLookup] = useState<Record<string, WorkspaceMemberProfile>>({})
  const { comments, loading: commentsLoading, error: commentsError, fetchComments} = useComments(currentWorkspaceId, currentUpload, "correlation")
  const { successToast, errorToast} = useToast();
  
  const addComment = async (payload: {content: string; anchor_x: number; anchor_y: number})=> {
      if(!currentWorkspaceId || !currentUpload) return
      try{
        await commentService.addComment(currentWorkspaceId, {
          content: payload.content,
          anchor_x: payload.anchor_x,
          anchor_y: payload.anchor_y,
          upload_id: currentUpload,
          tab: "correlation",
        })
        fetchComments()
        successToast("Comment has been added successfully")
      } catch(error: any){
        console.error("Failed to add comment", error)
        errorToast("Failed to add comment")
    }}

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
    <div className="w-full h-full flex gap-3">
      <div className="flex flex-col flex-1">
        <CorrelationTabToolbar
          window={window}
          setWindow={setWindow}
          bin={bin}
          setBin={setBin}
          offset={offset}
          setOffset={setOffset}
          onHistoryRecorded={fetchHistory}
          historyOpen={historyOpen}
          onToggleHistory={() => setHistoryOpen((v) => !v)}
          commentsOpen={commentsOpen}
          onToggleComments={() => setCommentsOpen((v) => !v)}/>

        <CorrelationChart 
          comments={comments}
          onAddComment={addComment}
          />
      </div>
      {historyOpen && (
      <HistoryPanel
        entries={entries}
        loading={loading}
        error={error}
        members={members}
         onRevert={(entry) => {
          if(entry.parameter === "window") setWindow(entry.old_value);
          if(entry.parameter === "bin") setBin(entry.old_value);
          if(entry.parameter === "offset") setOffset(entry.old_value);
          historyService.revertEntry(currentWorkspaceId!, entry.id).then(fetchHistory);
         }}
      />
      )}
      {commentsOpen && (
        <CommentPanel
          comments={comments}
          loading={commentsLoading}
          error={commentsError}
          authorFinder={memberLookup}/>
      )}
    </div>
  );
}

export default CorrelationTab;
