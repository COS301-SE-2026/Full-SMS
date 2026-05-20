'use client';

import React, { useRef } from 'react';

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
}

export default function FileUploadZone({ onFilesSelected }: FileUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div onClick={triggerFilePicker}>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          className="hidden"
        />
        <p>Upload files</p>
      </div>
    </div>
  );
}