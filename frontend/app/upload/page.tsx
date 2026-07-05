'use client';

import React, { useState } from 'react';
import { FileUploadZone, FileList } from '@/components/upload';
import type { SelectedFile } from '@/components/upload';
import { initHdf5Upload, uploadToSignedUrl, completeHdf5Upload, computeSHA256, getHdf5UploadResult } from "@/services/hdf5services";
import { Button } from '@/components/ui';
import { useHdf5Data } from '@/contexts/Hdf5DataContext';



type UploadPageProps = {
  onComplete?: () => void
}

export default function UploadPage({ onComplete }: UploadPageProps) {
  const [queue, setQueue] = useState<SelectedFile[]>([]);
  const { setHdf5Data } = useHdf5Data()

  const updateItem = (id: string, patch: Partial<SelectedFile>) => {
  setQueue((prev) =>
    prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
  );
};


const handleOpen = async () => {
  const items = [...queue]
  let hadError = false

  for (const item of items) {
    updateItem(item.id, { status: "pending", progress: 0, errorMessage: undefined })
    try {
      const sha256_hash = await computeSHA256(item.file)
      const initialize = await initHdf5Upload({
        filename: item.name,
        size_bytes: item.sizeBytes,
        content_type: item.file.type,
        sha256: sha256_hash,
      });
      
      await uploadToSignedUrl(initialize.upload_url.signed_url, item.file, (pct) => {
        updateItem(item.id, { progress: pct })
      });

      await completeHdf5Upload(initialize.upload_id, {
        storage_key: initialize.storage_key,
        sha256: sha256_hash,
      });

      updateItem(item.id, { status: "success", progress: 100 })
      const result = await getHdf5UploadResult(initialize.upload_id)
      setHdf5Data(result)

    } catch (err: any) {
      hadError = true
      updateItem(item.id, {
        status: "error",
        errorMessage: err?.message ?? "Upload or parse failed",
      })
    }
  }

  if (!hadError) {
    onComplete?.()
  }
}

  const handleFilesSelected = (newFiles: File[]) => {
    const freshQueueEntries: SelectedFile[] = newFiles.map((file) => ({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      file,
      name: file.name,
      sizeBytes: file.size,
      progress: 0,
      status: 'idle',
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
    <main className=" text-zinc-100 font-sans p-4 sm:p-8 flex flex-col items-center justify-center pt-16">
      <div className="w-full max-w-4xl space-y-8">
  

        {/* File upload area */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest px-1 text-center block">
            Drop Your Files Here
          </label>
          <FileUploadZone onFilesSelected={handleFilesSelected} />
        </div>

        <FileList files={queue} onRemove={handleRemoveItem} />

        {/* Footer */}
        {queue.length > 0 && (
          <div className="flex items-center justify-end gap-3 pt-2 max-w-4xl mx-auto">
            <Button variant="outline" onClick={clearWholeStagingQueue} className="px-5 py-2 text-[13px] font-medium">
              Cancel
            </Button>
            <Button onClick={handleOpen} className="px-5 py-2 text-[13px] font-medium">
              Open
            </Button>
          </div>
        )}

      </div>
    </main>
  );
}