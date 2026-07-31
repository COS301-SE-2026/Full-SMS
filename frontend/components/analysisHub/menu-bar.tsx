import Link from "next/link";
import { SaveSessionModal } from "./save-session-modal";
import { useState } from "react";
import { sessionsService } from "@/services/sessionsServices";
import { useAuth } from "@/contexts/authContext/AuthContext";
import { RecentSessionsModal } from "./recent-sessions";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import { useAnalysisTab } from "@/contexts/analysisTabsContext/AnalysisTabsContext";
import { useToast } from "@/contexts/toastContext/ToastContext";
import { Button } from "../ui";
interface MenuBarProps {
  readonly onOpenFileUpload: () => void;
}

export function MenuBar({ onOpenFileUpload }: MenuBarProps) {
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const {currentUploadName, cpaData, groupingData, bin, confidence, currentUpload, hdf5Data, hdf5Metadata, currentMeasurement, currentWorkspaceId, heatMapColor, spectraHeatMapColor} = useHdf5Data()
  const {user} = useAuth()
  const {activeTab} = useAnalysisTab()
  const {successToast, errorToast} = useToast()
  const callSave = async (name: string) => {
    try{
      await sessionsService.saveSession(user?.id || 'anonymous', {name: name, dataset_ref: currentUpload, dataset_name: currentUploadName, parameters: {bin_size: bin, confidence: confidence}, results: {levels: cpaData, groups:groupingData, hdf5Data: hdf5Data, hdf5Metadata: hdf5Metadata, currentMeasurement: currentMeasurement, currentWorkspaceId: currentWorkspaceId, activeTab: activeTab, heatMapColor: heatMapColor, spectraHeatMapColor:spectraHeatMapColor}})
      successToast("Session has been saved")
      setSaveModalOpen(false)
    }catch(error){
      errorToast("Session not saved!")
      console.error("Failed to save session", error)
    }
  }
  const [recentSessionsModalOpen, setRecentSessionsModalOpen] = useState(false)

  return (
    <>
    <div className="flex items-center h-7 px-2 border-b border-border bg-background">
      
        <Button
          variant = "ghost"
          onClick={onOpenFileUpload}
          className="px-3 h-full text-xs text-foreground hover:bg-card rounded-sm transition-colors"
        >
          File
        </Button>

        <Button
          variant = "ghost"
          onClick={() => setSaveModalOpen(true)}
          className="px-3 h-full text-xs text-foreground hover:bg-card rounded-sm transition-colors"
        >
          Save
        </Button>

        <Button
          variant = "ghost"
          onClick={() => setRecentSessionsModalOpen(true)}
          className="px-3 h-full text-xs text-foreground hover:bg-card rounded-sm transition-colors"
        >
          Sessions
        </Button>

      <Link href="/profile">
          <Button
            variant = "ghost"
            onClick={onOpenFileUpload}
            className="px-3 h-full text-xs text-foreground hover:bg-card rounded-sm transition-colors"
          >
            Account
          </Button>
      </Link>

         <Link href="/help">
          <Button
            variant = "ghost"
            onClick={onOpenFileUpload}
            className="px-3 h-full text-xs text-foreground hover:bg-card rounded-sm transition-colors"
          >
            Help
          </Button>
      </Link>

    </div>
    <SaveSessionModal
        open={saveModalOpen}
        controlClose={() => setSaveModalOpen(false)}
        controlSave={callSave}
      />

      <RecentSessionsModal
        open={recentSessionsModalOpen}
        onClose={() => setRecentSessionsModalOpen(false)}
        />
    </>
  );
}
