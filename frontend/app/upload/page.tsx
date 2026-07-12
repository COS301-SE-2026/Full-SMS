'use client';

import React, { useState, useEffect } from 'react';
import { FileUploadZone, FileList } from '@/components/upload';
import type { SelectedFile } from '@/components/upload';
import { initHdf5Upload, uploadToSignedUrl, completeHdf5Upload, computeSHA256} from "@/services/hdf5services";
import { Button } from '@/components/ui';
import { useHdf5Data } from '@/contexts/Hdf5DataContext';
import {supabase} from '@/lib/supabase/supabaseConfig'
import { InitUploadResponse } from '@/types/hdf5';
import { Intensity_Req, intensityAnalysis } from '@/services/analysisServices';


type UploadPageProps = {
  onComplete?: () => void
}

export default function UploadPage({ onComplete }: UploadPageProps) {
  const [queue, setQueue] = useState<SelectedFile[]>([]);
  const {setIsParsing, setCurrentUpload, currentUpload, currentWorkspaceId } = useHdf5Data()
  const [uploadId, setUploadId] = useState<string>("");
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

      
      const initialize: InitUploadResponse = await initHdf5Upload({
        filename: item.name,
        workspace_id: currentWorkspaceId,
        size_bytes: item.sizeBytes,
        content_type: item.file.type,
        sha256: sha256_hash,
      });

      
      //get upload_id for status subscription (subscribing?? idk)
      setUploadId(initialize.upload_id)
      setCurrentUpload(initialize.upload_id)
      await uploadToSignedUrl(initialize.upload_url.signed_url, item.file, (pct) => {
        updateItem(item.id, { progress: pct })
      });

      await completeHdf5Upload(initialize.upload_id);

      //at this point the celery worker is now parsing the uploaded hdf5/h5 file

      updateItem(item.id, { status: "success", progress: 100 })


    } catch (err: any) {
      hadError = true
      updateItem(item.id, {
        status: "error",
        errorMessage: err?.message ?? "Upload or parse failed",
      })
    }
  }

}

useEffect (()=>{
  if(!uploadId){
    console.log("No upload_id found")
    return
  }
    console.log(`subbing to updates to upload status - upload_id = ${uploadId}`)

    const sub = supabase.channel(`follow-upload-${uploadId}`)
                .on(
                  "postgres_changes",
                  {
                    event: "UPDATE",
                    schema: "public",
                    table:"hdf5_uploads",
                    filter:`id=eq.${uploadId}`
                  },async (payload)=>{
                    console.log("Realtime Update:", payload);
                    const recentStatus: string = payload.new.status
                    console.log("recent status: ",recentStatus);
                    
                    if (recentStatus.toLowerCase() === 'parsed') {

                      console.log("Parsing is complete! Fetching final data...");
                      setIsParsing(false);
                      try {
                        const requestPayload: Intensity_Req = {
                          upload_id: currentUpload,
                          measurement_id: "1",
                          bin_size_ms: 10
                        }
                        const intensityTraceData = await intensityAnalysis(requestPayload)
                        console.log(intensityTraceData);
                        
                        
                      } catch (error) {
                        
                      }
                    }
                  }
                )
                .subscribe((status, err) => {
                  console.log("WebSocket Connection Status:", status);
                  if (err) console.error("WebSocket Error:", err);
                });
    return () =>{
      supabase.removeChannel(sub);
    }            
},[uploadId])

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
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest px-1 text-center block">
            Drop Your Files Here
          </span>
          <FileUploadZone onFilesSelected={handleFilesSelected} />
        </div>

        <FileList files={queue} onRemove={handleRemoveItem} />


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