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

export default function WorkspacePage() {
  const router = useRouter();
  const { currentWorkspaceId, setCurrentUpload } = useHdf5Data();

  const [isLoading, setIsLoading] = useState(true);
  console.log(currentWorkspaceId);
  const [data, setData] = useState<Workspace>();
  const [uploads, setUploads] = useState<UploadRecord[]>();
  const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false);
  const { showPicker, setShowPicker } = useAuth();
  
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
      // Tell the backend to fetch this file from Microsoft and begin processing
      await axiosInstance.post("/api/py/upload/onedrive", {
        //[cite: 3]
        file_id: fileId,
        filename: filename,
        workspace_id: currentWorkspaceId,
      });

      // Close the picker and refresh the workspace file list UI
      setShowPicker(false);
      // refreshWorkspaceFiles();
    } catch (error) {
      console.error("Backend failed to queue the file download", error);
    }
  };

useEffect(()=>{
    console.log("SHOW PICKER CHANGED");
},[showPicker])

  return (
    <div className="size-full flex h-screen bg-background text-foreground">
      <Sidebar />
      <Modal
        open={fileUploadModalOpen}
        onClose={() => setFileUploadModalOpen(false)}
      >
        <UploadPage />
      </Modal>
      <Modal
        open={showPicker}
        onClose={() => {
          setShowPicker(false);
        }}
      >
        <OneDrivePicker
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
