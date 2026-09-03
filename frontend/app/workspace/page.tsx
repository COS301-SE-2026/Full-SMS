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
import { FaGoogleDrive } from "react-icons/fa";
import { GrOnedrive } from "react-icons/gr";
import { OneDriveLogin } from "@/lib/microsoftAuth";
import { OneDrivePicker } from "@/components/cloud-integration/OneDrivePicker";
import { useAuth } from "@/contexts/authContext/AuthContext";
import axiosInstance from "@/lib/api/axiosInstance";
import { supabase } from "@/lib/supabase/supabaseConfig";

interface ProgressTrackerProps{
  activeUpload:{
    id: string;
    file_name: string;
    status: string;
    progress: number;
  }
}

function ProgressTracker({activeUpload}: ProgressTrackerProps) {
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

  const [isLoading, setIsLoading] = useState(true);
  console.log(currentWorkspaceId);
  const [data, setData] = useState<Workspace>();
  const [uploads, setUploads] = useState<UploadRecord[]>();
  const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false);
  const { showPicker, setShowPicker } = useAuth();
  const [activeUpload, setActiveUpload] = useState<{
    id: string;
    file_name: string;
    status: string;
    progress: number;
  } | null>(null);

  const handleUploadOpen = (upload_id: string) => {
    setCurrentUpload(upload_id);
    router.push("/analysisHub");
  };

  useEffect(() => {
    if (currentWorkspaceId) {
      const fetchWorkspace = async () => {
        const workspaceData =
          await workspaceService.getWorkspace(currentWorkspaceId);
        if (workspaceData.success) {
          setData(workspaceData.workspace);
          setIsLoading(false);
        }
        console.log(workspaceData);
      };

      const fetchWorspaceUploads = async () => {
        const uploads =
          await workspaceService.getWorkspaceUploads(currentWorkspaceId);
        if (uploads.success) {
          console.log(uploads);
          setUploads(uploads.uploads);
        }
      };
      fetchWorkspace();
      fetchWorspaceUploads();
    }
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
        progress: 5,
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
    const sub = supabase
      .channel(`follow-upload-${uploadId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "hdf5_uploads",
          filter: `id=eq.${uploadId}`,
        },
        async (payload) => {
          const recentStatus: string = payload.new.status;
          const progress: number = payload.new.progress || 0;

          setActiveUpload({
            id: uploadId,
            file_name: filename,
            status: recentStatus,
            progress: progress,
          });

          if (
            recentStatus.toLocaleLowerCase() === "parsed" &&
            currentWorkspaceId
          ) {
            const refreshWorkspace =
              await workspaceService.getWorkspaceUploads(currentWorkspaceId);
            if (refreshWorkspace.success) {
              setUploads(refreshWorkspace.uploads);
            }

            setTimeout(() => {
              setActiveUpload(null);
              supabase.removeChannel(sub);
            }, 2000);
          } else if (recentStatus.toLowerCase() === "failed") {
            setTimeout(() => {
              setActiveUpload(null);
              supabase.removeChannel(sub);
            }, 4000);
          }
        },
      )
      .subscribe();
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
        } catch (e) {}
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      channel?.close();
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", handleStorage);
    };
  }, [setShowPicker]);

  return (
    <div className="size-full flex h-screen bg-background text-foreground">
      <Sidebar />
      <Modal
        open={fileUploadModalOpen}
        onClose={() => setFileUploadModalOpen(false)}
      >
        <UploadPage />
      </Modal>
      <Modal open={showPicker} onClose={() => setShowPicker(false)}>
        <OneDrivePicker
          baseUrl={
            process.env.NEXT_PUBLIC_ONEDRIVE_BASE_URL ||
            "https://onedrive.live.com"
          }
          onFilePicked={handleOneDriveFileSelection}
          onCancel={() => setShowPicker(false)}
        />
      </Modal>
      <div className="flex justify-center">
        {isLoading && data ? (
          <Loader centered={true} />
        ) : (
          <div className="p-16">
            <h1 className="font-bold">{data?.name?.toUpperCase()}</h1>
            <p>{data?.description}</p>
            <Badge variant="success" className="mt-2">
              {data?.status}
            </Badge>

            <div className="mt-4 flex justify-between h-min">
              <h2>Workspace Uploads</h2>
              <div className="flex gap-2">
                <Button leftIcon={<FaGoogleDrive size={24} />}>
                  Google Drive
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
            <div>
              {activeUpload && <ProgressTracker activeUpload={activeUpload}/>}
            </div>
            {!uploads || uploads.length === 0 ? (
              <div>
                <p>No Uploads yet. Load your first h5/hdf5 file.</p>
              </div>
            ) : (
              uploads.map((upload, index) => (
                <Card
                  key={upload.id || index}
                  className="upload-item w-[70vw] mt-4"
                  onClick={() => {
                    handleUploadOpen(upload.id);
                  }}
                >
                  <CardHeader className="font-bold">
                    {upload.filename}
                  </CardHeader>
                  <CardContent>
                    {(upload.size_bytes / (1024 * 1024)).toPrecision(2)} MB
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
