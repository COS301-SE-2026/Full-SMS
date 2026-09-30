"use client";

import { MenuBar } from "@/components/analysisHub/menu-bar";
import { Sidebar } from "@/components/analysisHub/sidebar";
import { IntensityChart } from "@/components/analysisHub/intensity-tab/intensity-chart";
import { StatusBar } from "@/components/analysisHub/status-bar";
import { AnalysisToolbar } from "@/components/analysisHub/intensity-tab/analysis-toolbar";
import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import UploadPage from "../upload/page";
import { useAnalysisTab } from "@/contexts/analysisTabsContext/AnalysisTabsContext";
import GroupingTab from "@/components/analysisHub/grouping-tab/grouping-tab";
import RasterTab from "@/components/analysisHub/raster-tab/raster-tab";
import SpectraMap from "@/components/analysisHub/spectra-tab/spectra-map";
import PluginTab from "@/components/analysisHub/plugin-tab/PluginTab";
import LifetimeTab from "@/components/analysisHub/lifetime-tab/lifetime-tab";
import FittingDialog from "@/components/analysisHub/lifetime-tab/fitting-dialog";

import { pluginService } from "@/services/pluginServices";
import { Plugin } from "@/types/plugin";
import ExportPanel from "@/components/analysisHub/export-tab/export-tab-panel";
import { Card } from "@/components/ui";
import CorrelationTab from "@/components/analysisHub/correlation-tab/correlation-tab";
import { HistoryPanel } from "@/components/analysisHub/history/HistoryPanel";
import { useHistory } from "@/hooks/useHistory";
import { historyService } from "@/services/historyServices";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import { WorkspaceMemberProfile } from "@/types/workspace";
import { workspaceService } from "@/services/workspaceServices";
import { CommentPanel } from "@/components/analysisHub/comments/CommentPanel";
import { useComments } from "@/hooks/useComments";
import { commentService } from "@/services/commentServices";
import { useToast } from "@/contexts/toastContext/ToastContext";

export default function App() {
  const {successToast, errorToast} = useToast();
  const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false);
  const { activeTab, fittingDialogOpen, setFittingDialogOpen } =
    useAnalysisTab();
  const [currentPlugin, setCurrentPlugin] = useState<Plugin | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [memberLookup, setMemberLookup] = useState<Record<string, WorkspaceMemberProfile>>({});
  const { currentWorkspaceId, currentUpload, setBin, setConfidence, members } = useHdf5Data();
  const {comments, loading: commentsLoading, error: commentsError, fetchComments } = useComments(currentWorkspaceId, currentUpload, "intensity");

  const { entries, loading, error, fetchHistory} = useHistory(currentWorkspaceId, currentUpload, "intensity",);
  const isPluginTab = activeTab.startsWith("plugin:");
  const pluginId = isPluginTab ? activeTab.replace("plugin:", "") : null;

  const isLoadingPlugin = isPluginTab && currentPlugin?.id !== pluginId;

  const controlAddComment = async (payload: { content: string; anchor_x: number; anchor_y: number}) => {
    if (!currentWorkspaceId || !currentUpload) return;
    try{
      await commentService.addComment(currentWorkspaceId, {
        content: payload.content,
        anchor_x: payload.anchor_x,
        anchor_y: payload.anchor_y,
        upload_id: currentUpload,
        tab: "intensity",
      });
      fetchComments();
      successToast("Comment has been added successfully");
    }catch(error: any){
      errorToast(error.message || "Failed to add comment");
    }
  };
  const {currentUploadName} = useHdf5Data()

  useEffect(() => {
    if (!pluginId) {
      return;
    }

    let cancelled = false;

    pluginService
      .getPlugin(pluginId)
      .then((response) => {
        if (!cancelled) {
          setCurrentPlugin(response.plugin ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) setCurrentPlugin(null);
      });

    return () => {
      cancelled = true;
    };
  }, [pluginId]);

  useEffect(() => {
    if(!currentWorkspaceId) return;
    let cancelled = false;

    workspaceService.getWorkspaceMembers(currentWorkspaceId)
    .then((res) => {
      if(cancelled) return;
      const lookup: Record<string, WorkspaceMemberProfile> = {};
      for (const user of res.members){
        lookup[user.id] = user;
      }
      setMemberLookup(lookup);
    })
    .catch(() => {
      if(!cancelled) setMemberLookup({});
    });

    return () => {cancelled = true};
  }, [currentWorkspaceId])

  return (
    <div className="size-full flex flex-col bg-background text-foreground h-screen">
      <MenuBar onOpenFileUpload={() => setFileUploadModalOpen(true)} />

      <Modal
        open={fileUploadModalOpen}
        onClose={() => setFileUploadModalOpen(false)}
      >
        <UploadPage />
      </Modal>

      <Modal
        open={fittingDialogOpen}
        onClose={() => setFittingDialogOpen(false)}
      >
        <FittingDialog />
      </Modal>

      <Card className="inline-flex md:hidden m-4 p-5 border-destructive text-center">
        Please use analysis hub from the desktop version.
      </Card>

      <div className="hidden md:flex flex-1 min-h-0">
        <Sidebar />

        {activeTab === "intensity" && (
          <div className="flex flex-col flex-1 min-w-0">
            <AnalysisToolbar onHistoryChange={fetchHistory} historyOpen={historyOpen} onToggleHistory={() => setHistoryOpen((v) => !v)}
              commentsOpen={commentsOpen} onToggleComments={() => setCommentsOpen((v) => !v)}/>
            <div className="flex flex-1 gap-3 p-3 min-h-0">
              <IntensityChart comments={comments} onAddComment={controlAddComment}/>
              {historyOpen && (<HistoryPanel
                entries={entries}
                loading={loading}
                error={error}
                members={members}
                onRevert={async (entry) => {
                  const { entry: reverted}=await historyService.revertEntry(currentWorkspaceId!, entry.id);
                  if(reverted.parameter === "bin") setBin(reverted.new_value);
                  if(reverted.parameter === "confidence") setConfidence(reverted.new_value as any);
                  fetchHistory();
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
          </div>
        )}

        {activeTab === "grouping" && (
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex flex-1 gap-3 p-3 min-h-0">
              <GroupingTab />
            </div>
          </div>
        )}

        {activeTab === "raster" && (
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex flex-1 gap-3 p-3 min-h-0">
              <RasterTab />
            </div>
          </div>
        )}

        {activeTab === "spectra" && (
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex flex-1 gap-3 p-3 min-h-0">
              <SpectraMap />
            </div>
          </div>
        )}

        {activeTab === "lifetime" && (
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex flex-1 gap-3 p-3 min-h-0">
              <LifetimeTab />
            </div>
          </div>
        )}
        {activeTab === "correlation" && (
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex flex-1 gap-3 p-3 min-h-0">
              <CorrelationTab />
            </div>
          </div>
        )}

        {isPluginTab && isLoadingPlugin && (
          <div className="flex flex-col flex-1 min-w-0 p-4">
            <div className="flex items-center justify-center h-full">
              <p className="text-foreground/40">Loading plugin...</p>
            </div>
          </div>
        )}

        {isPluginTab && !isLoadingPlugin && currentPlugin && (
          <div className="flex flex-col flex-1 min-w-0">
            <PluginTab plugin={currentPlugin} key={currentPlugin.id} />
          </div>
        )}

        {isPluginTab && !isLoadingPlugin && !currentPlugin && (
          <div className="flex flex-col flex-1 min-w-0 p-4">
            <div className="flex items-center justify-center h-full bg-card border border-border rounded-lg">
              <p className="text-foreground/40">Plugin not found</p>
            </div>
          </div>
        )}

        {activeTab === "export" && (
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex flex-1 gap-3 p-3 min-h-0">
              <ExportPanel />
            </div>
          </div>
        )}
      </div>
      <StatusBar />
    </div>
  );
}
