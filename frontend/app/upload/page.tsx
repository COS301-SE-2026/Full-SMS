"use client";

import React, { useState, useEffect } from "react";
import { FileUploadZone, FileList } from "@/components/upload";
import type { SelectedFile } from "@/components/upload";
import {
  initHdf5Upload,
  uploadToSignedUrl,
  completeHdf5Upload,
  computeSHA256,
  getHdf5UploadStatus,
} from "@/services/hdf5services";
import { Button } from "@/components/ui";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import { supabase } from "@/lib/supabase/supabaseConfig";
import { InitUploadResponse } from "@/types/hdf5";
import RecentUploads from "@/components/upload/recentUploads";
import { GrOnedrive } from "react-icons/gr";
import { OneDriveLogin } from "@/lib/microsoftAuth";
import { useToast } from "@/contexts/toastContext/ToastContext";

type UploadPageProps = {
  onComplete?: () => void;
};

export default function UploadPage({ onComplete }: UploadPageProps) {
  const [queue, setQueue] = useState<SelectedFile[]>([]);
  const {
    setIsParsing,
    setCurrentUpload,
    currentWorkspaceId,
    setCurrentUploadName,
  } = useHdf5Data();
  const [uploadId, setUploadId] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [refreshUploads, setRefreshUploads] = useState<number>(0);
  const { successToast, errorToast } = useToast();

  const updateItem = (id: string, patch: Partial<SelectedFile>) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const handleOpen = async () => {
    if (isUploading || isProcessing) return;

    setIsUploading(true);
    const items = [...queue];
    let hadError = false;
    let successCount = 0;

    for (const item of items) {
      updateItem(item.id, {
        status: "pending",
        progress: 0,
        errorMessage: undefined,
      });
      try {
        const sha256_hash = await computeSHA256(item.file);

        const initialize: InitUploadResponse = await initHdf5Upload({
          filename: item.name,
          workspace_id: currentWorkspaceId,
          size_bytes: item.sizeBytes,
          content_type: item.file.type,
          sha256: sha256_hash,
        });

        setUploadId(initialize.upload_id);
        setCurrentUpload(initialize.upload_id);
        setCurrentUploadName(item.name);

        await uploadToSignedUrl(
          initialize.upload_url.signed_url,
          item.file,
          (pct) => {
            updateItem(item.id, { progress: pct });
          },
        );

        await completeHdf5Upload(initialize.upload_id);

        updateItem(item.id, { status: "success", progress: 100 });
        successCount++;

        setIsUploading(false);
        setIsProcessing(true);

        const pollForParsed = async (uploadId: string, maxAttempts = 30) => {
          for (let i = 0; i < maxAttempts; i++) {
            try {
              const statusResponse = await getHdf5UploadStatus(uploadId);
              if (statusResponse?.status?.toLowerCase() === "parsed") {
                return true;
              }
            } catch (e) {
              console.log("Status check failed:", e);
            }
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
          return false;
        };

        const isParsed = await pollForParsed(initialize.upload_id);

        if (isParsed) {
          setIsParsing(false);
        }
      } catch (err: any) {
        hadError = true;
        updateItem(item.id, {
          status: "error",
          errorMessage: err?.message ?? "Upload or parse failed",
        });
      }
    }

    setIsUploading(false);
    setIsProcessing(false);

    if (successCount > 0) {
      successToast(
        `Upload complete! ${successCount} file(s) ready. Go to your workspace to start analysis.`,
      );
      setQueue([]);
      setRefreshUploads((prev) => prev + 1);
    }

    if (hadError) {
      errorToast("Some files failed to upload. Check the list for details.");
    }
  };

  useEffect(() => {
    if (!uploadId) {
      return;
    }

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

          if (recentStatus.toLowerCase() === "parsed") {
            setIsParsing(false);
            setRefreshUploads((prev) => prev + 1);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [uploadId]);

  const handleFilesSelected = (newFiles: File[]) => {
    const freshQueueEntries: SelectedFile[] = newFiles.map((file) => ({
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2),
      file,
      name: file.name,
      sizeBytes: file.size,
      progress: 0,
      status: "idle",
    }));

    setQueue((prevQueue) => [...prevQueue, ...freshQueueEntries]);
  };

  const handleRemoveItem = (id: string) => {
    setQueue((prevQueue) => prevQueue.filter((item) => item.id !== id));
  };

  const clearWholeStagingQueue = () => {
    setQueue([]);
  };

  return (
    <main className="p-4 sm:p-8 flex flex-col items-center justify-center pt-16">
      <div className="w-full max-w-4xl space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-semibold text-foreground/50 uppercase tracking-widest px-1 text-center block">
            Drop your local files here or use OneDrive below
          </span>
          <FileUploadZone onFilesSelected={handleFilesSelected} />
        </div>
        {queue.length > 0 && (
          <>
            <FileList files={queue} onRemove={handleRemoveItem} />
            <div className="flex items-center justify-end gap-3 pt-2 max-w-4xl mx-auto">
              <Button
                variant="outline"
                onClick={clearWholeStagingQueue}
                disabled={isUploading || isProcessing}
                className="px-5 py-2 text-[13px] font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleOpen}
                disabled={isUploading || isProcessing}
                className="px-5 py-2 text-[13px] font-medium"
              >
                {isUploading
                  ? "Uploading..."
                  : isProcessing
                    ? "Processing..."
                    : "Upload"}
              </Button>
            </div>
          </>
        )}
        <RecentUploads key={refreshUploads} />
        <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-border max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={onComplete}
            className="px-5 py-2 text-[13px] font-medium"
          >
            Close
          </Button>
          <Button
            leftIcon={<GrOnedrive size={18} />}
            onClick={OneDriveLogin}
            className="px-5 py-2 text-[13px] font-medium"
          >
            OneDrive
          </Button>
        </div>
      </div>
    </main>
  );
}
