'use client';

import React, { useState,useRef } from 'react';

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
}

const ALLOWED_EXTENSIONS = ['.pt3', '.csv', '.h5', '.hdf5'];

export interface SelectedFile {
  id: string;            
  name: string;         
  sizeBytes: number;   
  progress: number;     
  status: 'idle' | 'pending' | 'success' | 'error'; 
  errorMessage?: string; 
}

export default function FileUploadZone({ onFilesSelected }: FileUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

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