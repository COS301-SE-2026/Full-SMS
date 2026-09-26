"use client";

import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import React, { useEffect, useState } from "react";
import { workspaceService } from "@/services/workspaceServices";
import { Workspace } from "@/types/workspace";
import Sidebar from "@/components/dashboard/Sidebar";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Loader,
} from "@/components/ui";
import { UploadRecord } from "@/types/hdf5";
import { Modal } from "@/components/ui/Modal";
import UploadPage from "../upload/page";
import { useRouter } from "next/navigation";
import { GrOnedrive } from "react-icons/gr";
import { OneDriveLogin } from "@/lib/microsoftAuth";
import { OneDrivePicker } from "@/components/cloud-integration/OneDrivePicker";
import { useAuth } from "@/contexts/authContext/AuthContext";
import axiosInstance from "@/lib/api/axiosInstance";
import { getHdf5UploadStatus } from "@/services/hdf5services";
import { DeleteIcon, TrashIcon, UserPlus } from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import { getWorkspaceIrfs } from "@/services/irfServices";
import { ManageMembersModal } from "@/components/dashboard/ManageMembersModal";

interface ProgressTrackerProps {
  activeUpload: {
    id: string;
    file_name: string;
    status: string;
    progress: number;
  };
}

interface WorkspaceMemberProfile{
  id: string;
  email: string;
  username: string | null;
  role: string;
}

interface MemberProps{
  member_ids: WorkspaceMemberProfile[];
  owner_id: string;
  is_owner: boolean;
  onManageMembersClick: () => void;
}

const MAX_MEMBERS_VISIBLE = 4;

const AVATAR_COLORS = [
  {text: "text-cyan-300", ring: "ring-[#2a3040]", bg: "bg-[#1e2330]"},
  {text: "text-purple-300", ring: "ring-[#3a2f45]", bg: "bg-[#2a2233]"},
  {text: "text-emerald-300", ring:"ring-[#26443c]", bg: "bg-[#1b2b28]"}
];

function WorkspaceMemberBar({member_ids, owner_id, is_owner, onManageMembersClick}: MemberProps){
  const visible_members = member_ids.slice(0, MAX_MEMBERS_VISIBLE);
  const overflow_count = member_ids.length - visible_members.length;

  const getMembersInitials = (member: WorkspaceMemberProfile) => {
    const label = member.username || member.email || "?";
    return label.slice(0, 2).toUpperCase();
  };

  return(
    <div className="flex items-center gap-4 pt-3 mb-8">
      <div className="flex -space-x-2 items-center">
        {visible_members.map((member, index) => {
          const setOfColors = AVATAR_COLORS[index % AVATAR_COLORS.length];
          return(
          <div
            key={member.id}
            className={`w-8 h-8 rounded-full ${setOfColors.bg} border-2 border-[#0e1015] flex items-center justify-center text-xs ring-1 ${setOfColors.ring} font-semibold ${setOfColors.text}`}
            title={member.username || member.email}>
              {getMembersInitials(member)}
            </div>
            );
          })}
        {overflow_count > 0 && (
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs border-2 border-cardBg text-white">
            +{overflow_count}
          </div>
        )}
      </div>

      {is_owner && (
        <button
          onClick={onManageMembersClick}
          className="hover:text-cyan-300 text-cyan-400 text-sm flex items-center gap-1">
            <UserPlus className="h-3.5 w-3.5" />
            <span>Manage Members</span>
          </button>
      )}
    </div>
  )}

function ProgressTracker({ activeUpload }: ProgressTrackerProps) {
  return (
    <div className="w-[70vw] mt-4 p-4 rounded-lg border border-border bg-card shadow-sm space-y-2">
      <div className="flex justify-between items-center text-sm font-medium">
        <span className="truncate max-w-[300px]">{activeUpload.file_name}</span>
        <span className="capitalize text-primary">
          {activeUpload.status}... ({activeUpload.progress}%)
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${activeUpload.progress}%` }}
        />
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  const router = useRouter();
  const { currentWorkspaceId, setCurrentUpload } = useHdf5Data();

  const [displayManageModal, setDisplayManageModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  console.log(currentWorkspaceId);
  const [data, setData] = useState<Workspace>();
  const [membersList, setMembersList] = useState<WorkspaceMemberProfile[]>([]);
  const [uploads, setUploads] = useState<UploadRecord[]>();
  const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false);
  const { showPicker, setShowPicker } = useAuth();
  const [activeUpload, setActiveUpload] = useState<{
    id: string;
    file_name: string;
    status: string;
    progress: number;
  } | null>(null);

  useEffect(()=>{
    currentWorkspaceId && getWorkspaceIrfs(currentWorkspaceId)  
}, [currentWorkspaceId])

  const handleUploadOpen = (upload_id: string) => {
    setCurrentUpload(upload_id);
    router.push("/analysisHub");
  };

  const fetchWorkspaceUploads = async () => {
    if (!currentWorkspaceId) return;
    const uploads =
      await workspaceService.getWorkspaceUploads(currentWorkspaceId);
    if (uploads.success) {
      setUploads(uploads.uploads);
    }
  };

  const fetchWorkspaceMembers = async () =>{
    if(!currentWorkspaceId) return;
    const membersList = await workspaceService.getWorkspaceMembers(currentWorkspaceId);
    if(membersList.success){
      setMembersList(membersList.members);
    }
  }
  useEffect(() => {
    if (!currentWorkspaceId) return;

    const loadData = async () => {
      const workspaceData =
        await workspaceService.getWorkspace(currentWorkspaceId);
      if (workspaceData.success) {
        setData(workspaceData.workspace);
        setIsLoading(false);
      }

      const uploadsData =
        await workspaceService.getWorkspaceUploads(currentWorkspaceId);
      if (uploadsData.success) {
        setUploads(uploadsData.uploads);
      }

      await fetchWorkspaceMembers();
    };

    loadData();
  }, [currentWorkspaceId]);

  const handleOneDriveFileSelection = async (
    fileId: string,
    filename: string,
  ) => {
    try {
      setShowPicker(false);
      setActiveUpload({
        id: "",
        file_name: filename,
        status: "Fetching data set from OneDrive",
        progress: 0,
      });

      // Tell the backend to fetch this file from Microsoft and begin processing
      const { data } = await axiosInstance.post(
        "/api/py/cloud/upload/onedrive",
        {
          file_id: fileId,
          filename: filename,
          workspace_id: currentWorkspaceId,
        },
      );

      if (data?.upload_id) {
        getUploadProgress(filename, data.upload_id);
      }
      // refreshWorkspaceFiles();
    } catch (error) {
      console.error("Backend failed to queue the dataset download", error);
    }
  };

  const getUploadProgress = (filename: string, uploadId: string) => {
    const handleUpdate = async (progress: number, recentStatus: string) => {
      setActiveUpload({
        id: uploadId,
        file_name: filename,
        status: recentStatus,
        progress: progress,
      });
      if (recentStatus.toLocaleLowerCase() === "parsed" && currentWorkspaceId) {
        const refreshWorkspace =
          await workspaceService.getWorkspaceUploads(currentWorkspaceId);
        if (refreshWorkspace.success) {
          setUploads(refreshWorkspace.uploads);
        }
        setTimeout(() => {
          clearInterval(pollInterval);
          setActiveUpload(null);
        }, 2000);
      } else if (recentStatus.toLowerCase() === "failed") {
        setTimeout(() => {
          clearInterval(pollInterval);
          setActiveUpload(null);
        }, 4000);
      }
    };

    const checkDbStatus = async () => {
      const response = await getHdf5UploadStatus(uploadId);
      if (response?.status) {
        handleUpdate(response.progress, response.status);
      }
    };
    void checkDbStatus();

    const pollInterval = setInterval(() => {
      void checkDbStatus();
    }, 1500);
  };

  useEffect(() => {
    // BroadcastChannel, listen to messages from callback state uto handle onedrive picker state
    // useState() couldnt carry through because multiple windows
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("onedrive_oauth_channel");
      channel.onmessage = (event) => {
        if (event.data?.type === "ONEDRIVE_AUTH_SUCCESS") {
          setShowPicker(true);
        }
      };
    } catch (e) {
      console.warn("BroadcastChannel not supported", e);
    }

    // 2. postMessage listener
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "ONEDRIVE_AUTH_SUCCESS") {
        setShowPicker(true);
      }
    };
    window.addEventListener("message", handleMessage);

    // 3. Storage event listener fallback
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "onedrive_auth_event" && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          if (data?.type === "ONEDRIVE_AUTH_SUCCESS") {
            setShowPicker(true);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      channel?.close();
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", handleStorage);
    };
  }, [setShowPicker]);

  const handleDeleteUpload = async (e: React.MouseEvent, uploadId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this dataset?")) return;
    try {
      if (!currentWorkspaceId) return;
      await workspaceService.deleteWorkspaceUpload(
        currentWorkspaceId,
        uploadId,
      );

      // Optimistically remove the deleted upload from local state
      setUploads((prev) => prev?.filter((u) => u.id !== uploadId));
    } catch (error) {
      console.error("Failed to delete upload:", error);
    }
  };

  const handleOpenIRFConfig = (e: React.MouseEvent, uploadId: string) =>{
    e.stopPropagation();
    setCurrentUpload(uploadId)
    router.push("/irfManagement")
  }

  return (
    <div className="size-full flex h-screen bg-background text-foreground">
      <Sidebar />
      <Modal
        open={fileUploadModalOpen}
        onClose={() => {
          setFileUploadModalOpen(false);
          fetchWorkspaceUploads();
        }}
      >
        <UploadPage
          onComplete={() => {
            setFileUploadModalOpen(false);
            fetchWorkspaceUploads();
          }}
        />
      </Modal>
      <Modal open={showPicker} onClose={() => setShowPicker(false)}>
        <OneDrivePicker
          onFilePicked={handleOneDriveFileSelection}
          onCancel={() => setShowPicker(false)}
        />
      </Modal>
      <div className="flex ustify-center w-full h-full">
        {isLoading ? (
          <div className="p-16 h-[vh] overflow-y-auto">
            <div className="h-8 w-36 mb-4 rounded bg-foreground/10 animate-pulse" />
            <div className="animate-pulse">
              <div className="h-6 w-56 rounded bg-foreground/10" />
              <div className="mt-2 h-4 w-80 max-w-full rounded bg-foreground/10" />
              <div className="mt-2 h-5 w-16 rounded bg-foreground/10" />
              <div className="mt-4 flex justify-between items-center h-min">
                <div className="h-5 w-44 rounded bg-foreground/10" />
                <div className="flex gap-2 items-center">
                  <div className="h-11 w-32 rounded bg-foreground/10" />
                  <div className="h-7 w-24 rounded bg-foreground/10" />
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-4 animate-pulse">
              <div className="h-20 w-[70vw] rounded-lg border border-border/40 bg-card/60" />
              <div className="h-20 w-[70vw] rounded-lg border border-border/40 bg-card/60" />
            </div>
          </div>
        ) : (
            <div className="p-16 h-[vh] overflow-y-auto w-full">
              <BackButton
                href="/dashboard"
                label="Back to Workspaces"
                className="mb-4"
              />
              <div>
                <h1 className="font-bold">{data?.name?.toUpperCase()}</h1>
                <p>{data?.description}</p>
                <Badge variant="success" className="mt-2">
                  {data?.status}
                </Badge>

                <WorkspaceMemberBar 
                  member_ids={membersList}
                  owner_id = {data?.user_id ?? ""}
                  is_owner = {data?.is_owner ?? false}
                  onManageMembersClick={() => setDisplayManageModal(true)}/>

                <ManageMembersModal 
                  open={displayManageModal}
                  onClose={() => setDisplayManageModal(false)}
                  workspaceId={currentWorkspaceId ?? ""}
                  ownerId={data?.user_id ?? ""}
                  members={membersList}
                  onMembersChanged={fetchWorkspaceMembers}/>

                <div className="mt-4 flex justify-between h-min">
                  <h2>Workspace Uploads</h2>
                  <div className="flex gap-2">
                    <Button className="font-black border-0 text-primary bg-primary/10" 
                      variant={"secondary"}
                      onClick={() => router.push("/irfManagement")}
                      >
                      IRF Mapping
                    </Button>
                    <Button
                      leftIcon={<GrOnedrive size={24} />}
                      onClick={OneDriveLogin}
                    >
                      OneDrive
                    </Button>
                    <Button
                      variant="outline"
                      className=""
                      size="sm"
                      onClick={() => {
                        setFileUploadModalOpen(true);
                      }}
                    >
                      Upload File
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                {activeUpload && (
                  <ProgressTracker activeUpload={activeUpload} />
                )}
              </div>
              {!uploads || uploads.length === 0 ? (
                <div>
                  <p>No Uploads yet. Load your first h5/hdf5 file.</p>
                </div>
              ) : (
                uploads.map((upload, index) => (
                  <Card
                    key={upload.id || index}
                    className="upload-item w-full mt-4 flex flex-row justify-between items-center"
                    onClick={() => {
                      handleUploadOpen(upload.id);
                    }}
                  >
                    <div>
                      <CardHeader className="font-bold">
                        {upload.filename}
                      </CardHeader>
                      <CardContent>
                        {(upload.size_bytes / (1024 * 1024)).toPrecision(2)} MB
                      </CardContent>
                    </div>
                    <div className="flex flex-row items-center">
                      <Button 
                        variant={"ghost"}
                        className=" hover:bg-primary/10 text-primary/50 hover:text-primary font-black"
                        onClick={(e) => {handleOpenIRFConfig(e, upload.id)}}
                      >
                        <span >IRF</span>
                      </Button>
                      <Button
                        variant={"ghost"}
                        className="mr-10 hover:bg-destructive/10"
                        onClick={(e) => handleDeleteUpload(e, upload.id)}
                      >
                        <TrashIcon className="text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
        )}
      </div>
    </div>
  );
}
