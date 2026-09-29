/**
 * FileFormatUpload.tsx
 *
 * Universal File Format Upload Component
 * Supports: HDF5, PicoQuant, Becker & Hickl, Photon-HDF5, CSV
 *
 * Usage:
 * <FileFormatUpload workspaceId={workspaceId} onUploadComplete={(file) => console.log(file)} />
 */

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
