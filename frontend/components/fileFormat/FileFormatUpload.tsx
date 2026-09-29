'use client';

import FileUploadZone from '@/components/upload/FileUploadZone';

interface FileFormatUploadProps {
  readonly onUploadComplete?: (file: File) => void;
}

export default function FileFormatUpload({
  onUploadComplete,
}: FileFormatUploadProps) {
  return <FileUploadZone onFilesSelected={(files) => files[0] && onUploadComplete?.(files[0])} />;
}
