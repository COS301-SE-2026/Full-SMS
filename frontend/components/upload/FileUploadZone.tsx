//FileUlpoadZone no style

'use client';

import React, { useState, useRef } from 'react';
import { TrackedFile } from './uploadProgress';
import { SelectedFile } from '@/types/file';

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
}

const ALLOWED_EXTENSIONS = ['.pt3', '.csv', '.h5', '.hdf5'];


export default function FileUploadZone({ onFilesSelected }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    setError(null);

    const validFiles: File[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
     
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      if (ALLOWED_EXTENSIONS.includes(fileExtension)) {
        validFiles.push(file);
      } else {
        
        setError(`Unsupported file type: ${file.name}. Only ${ALLOWED_EXTENSIONS.join(', ')} files are allowed.`);
      }
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndProcessFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndProcessFiles(e.target.files);
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFilePicker}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-200 flex flex-col items-center justify-center min-h-[220px] ${
          isDragging
            ? 'border-[#4fd1c5] bg-[#4fd1c5]/10 text-[#4fd1c5]'
            : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 text-zinc-400'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept={ALLOWED_EXTENSIONS.join(',')}
          multiple
          className="hidden"
        />
        
        {/* File icon*/}
        <svg
          className="w-12 h-12 mb-4 text-zinc-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        <p className="font-medium text-zinc-200">
          Drag and drop your spectroscopy files here, or <span className="text-[#4fd1c5] hover:underline">browse</span>
        </p>
        <p className="text-xs text-zinc-500 mt-2">
          Accepts: {ALLOWED_EXTENSIONS.join(', ')} up to 500MB
        </p>
      </div>

      {/* Error meaasage */}
      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800 text-red-400 text-sm rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}