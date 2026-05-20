'use client';

import React from 'react';
import { SelectedFile } from './FileUploadZone';

interface FileListProps {
  files: SelectedFile[];
  onRemove?: (id: string) => void;
}

export default function FileList({ files }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-2">
      <div className="text-xs text-zinc-500 font-medium px-1 flex justify-between">
        <span>Staged Items</span>
        <span>{files.length} Total</span>
      </div>

      <div className="w-full rounded-lg border border-[#2a2a2a] bg-[#18181c]/80 p-3 shadow-2xl">
        <div className="border border-[#222226] bg-[#111114] rounded-[5px] overflow-hidden">
          <div className="divide-y divide-[#1f1f24] max-h-[380px] overflow-y-auto">
            {files.map((file) => (
              <div key={file.id} className="px-5 py-3.5 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-zinc-300 truncate">{file.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}