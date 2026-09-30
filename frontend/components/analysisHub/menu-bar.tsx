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
import ThemeToggle from "../ui/ThemeToggle";
import BackButton from "@/components/ui/BackButton";
import { useRouter } from "next/navigation";
import { NotificationBell } from "./notification-bell";
import { useNotifications } from "@/hooks/useNotifications";

interface MenuBarProps {
  readonly onOpenFileUpload: () => void;
}

export function MenuBar({ onOpenFileUpload }: MenuBarProps) {
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const {currentUploadName, cpaData, groupingData, bin, confidence, currentUpload, hdf5Data, hdf5Metadata, currentMeasurement, currentWorkspaceId, heatMapColor, spectraHeatMapColor} = useHdf5Data()
  const {user} = useAuth()
  const {activeTab, fitResult} = useAnalysisTab()
  const {successToast, errorToast} = useToast()
  const { notifications, markRead, acceptInvite, declineInvite} = useNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [notifOpen, setNotifOpen] = useState(false);
  const callSave = async (name: string) => {
    try{
      await sessionsService.saveSession({name: name, dataset_ref: currentUpload, dataset_name: currentUploadName, parameters: {bin_size: bin, confidence: confidence}, results: {levels: cpaData, groups:groupingData, fits: fitResult, hdf5Data: hdf5Data, hdf5Metadata: hdf5Metadata, currentMeasurement: currentMeasurement, currentWorkspaceId: currentWorkspaceId, activeTab: activeTab, heatMapColor: heatMapColor, spectraHeatMapColor:spectraHeatMapColor}})
      successToast("Session has been saved")
      setSaveModalOpen(false)
    }catch(error){
      errorToast("Session not saved!")
      console.error("Failed to save session", error)
    }
  }
  const [recentSessionsModalOpen, setRecentSessionsModalOpen] = useState(false)
  const router = useRouter()

  return (
    <>
    <div className="flex items-center h-8 px-2 border-b border-border bg-background">
        <BackButton className="px-3 h-full text-sm hover:bg-card rounded-sm" />
        <Button
          variant = "ghost"
          onClick={onOpenFileUpload}
          className="px-3 h-full text-sm text-foreground hover:bg-card rounded-sm transition-colors"
        >
          File
        </Button>

        <Button
          variant = "ghost"
          onClick={() => setSaveModalOpen(true)}
          className="px-3 h-full text-sm text-foreground hover:bg-card rounded-sm transition-colors"
        >
          Save
        </Button>

        <Button
          variant = "ghost"
          onClick={() => setRecentSessionsModalOpen(true)}
          className="px-3 h-full text-sm text-foreground hover:bg-card rounded-sm transition-colors"
        >
          Sessions
        </Button>
        
        <Button
          variant = "ghost"
          onClick={() => {router.push("/profile");}}
          className="px-3 h-full text-sm text-foreground hover:bg-card rounded-sm transition-colors"
        >
          Account
        </Button>

      {/* <ThemeToggle
        toggleType='button'
       className="px-3 h-full text-md text-foreground hover:bg-card rounded-sm transition-colors"
      >
        Theme
      </ThemeToggle> */}

      <Button
        variant="ghost"
        onClick={() => {router.push("/plugins");}}
        className="px-3 h-full text-sm text-foreground hover:bg-card rounded-sm transition-colors"
      >
        Plugins
      </Button>

      <Button
        variant = "ghost"
        onClick={() => {router.push("/help");}}
        className="px-3 h-full text-sm text-foreground hover:bg-card rounded-sm transition-colors"
      >
        Help
      </Button>

      <div className="relative ml-auto">
        <NotificationBell unreadCount={unreadCount} onClick={() => setNotifOpen(!notifOpen)} />
          {notifOpen && (
            <div className="absolute right-0 top-8 w-72 bg-background border border-border rounded-sm shadow-lg z-50">
              <h4 className="text-xs font-semibold text-foreground/70 px-3 py-2 border-b border-border"> Notifications</h4>
              {notifications.length === 0 && <p className="text-sm px-3 py-2">No notifications yet.</p>}
              <ul className="max-h-80 overflow-y-auto">
                {notifications.map((n) =>(
                  <li
                    key={n.id}
                    className={`px-3 py-2 text-xs cursor-pointer border-b border-border/40 ${n.read ? "text-foreground/50": "text-foreground"}`}
                    >
                    <p onClick={() => markRead(n.id)} className="cursor-pointer">{n.message}</p>
                      {n.type === "invite" && !n.read && (
                        <div className="flex gap-2 mt-1">
                          <button onClick={() => acceptInvite(n.id)} className="text-green-600 hover:underline">Accept</button>
                          <button onClick={() => declineInvite(n.id)} className="text-red-600 hover:underline">Decline</button>
                        </div>
                      )}
                    </li>
                ))}
              </ul>
            </div>
          )}
      </div>


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
