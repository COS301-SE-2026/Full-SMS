'use client';

import React, { useState } from 'react';
import { FileUploadZone, FileList } from '@/components/upload';
import type { SelectedFile } from '@/components/upload';
import { uploadFile, readHdf5 } from "@/services/hdf5services";
import { Button } from '@/components/ui';
import { useHdf5Data } from '@/contexts/Hdf5DataContext';



export default function UploadPage() {
  const [queue, setQueue] = useState<SelectedFile[]>([]);
  const { setHdf5Data } = useHdf5Data()

  const updateItem = (id: string, patch: Partial<SelectedFile>) => {
  setQueue((prev) =>
    prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
  );
};

const handleOpen = async () => {
  const items = [...queue]; // snapshot

  for (const item of items) {
    updateItem(item.id, {
      status: "pending",
      progress: 0,
      errorMessage: undefined,
    });

    try {
      await uploadFile(item.file, (pct) =>
        updateItem(item.id, { progress: pct })
      );

      const parsed = await readHdf5(item.file);

      updateItem(item.id, { status: "success", progress: 100 });
      setHdf5Data(parsed)
      console.log("Parsed HDF5:", parsed);

    } catch (err: any) {
      updateItem(item.id, {
        status: "error",
        errorMessage: err?.message ?? "Upload or parse failed",
      });
    }
  }
};

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
    <main className="min-h-screen bg-[#0b0b0d] text-zinc-100 font-sans p-4 sm:p-8 flex flex-col items-center justify-start pt-16">
      <div className="w-full max-w-4xl space-y-8">
        
        <div className="w-full rounded-xl border border-[#222226] bg-[#141417] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#222226] pb-3">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block">
                File Picker Dialog
              </span>
              <h1 className="text-lg font-medium text-zinc-200 tracking-wide">
                Open HDF5 Measurement
              </h1>
            </div>
            
            <button className="text-zinc-500 hover:text-zinc-200 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Directory Bar */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 tracking-wider">Directory</label>
            <div className="flex items-center gap-3 w-full bg-[#0d0d0f] border border-[#26262b] rounded-md px-3.5 py-2 text-[13px] font-mono text-zinc-400 shadow-inner">
              <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.34a1.5 1.5 0 01-1.062-.44z" />
              </svg>
              <span className="truncate">~/data/SMS/2026/april</span>
            </div>
          </div>

          <div className="text-[11.5px] text-zinc-500 font-medium px-0.5 pt-1">
            Filter: <span className="font-mono text-zinc-400">*.h5, *.hdf5</span>
          </div>
        </div>

        {/* File upload area */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest px-1">
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