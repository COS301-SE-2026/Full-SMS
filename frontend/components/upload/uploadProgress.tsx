// Keeps track of the file status in real-time

export type UploadStatus = 'idle' | 'pending' | 'success' | 'error';

export interface TrackedFile{
    id: string;
    name: string;
    sizeBytes: number;
    progress: number;
    status: UploadStatus;
    errorMessage?: string;
}

export interface BackendUploadResponse{
    message: string;
    filename: string;
    saved_as: string;
    size_bytes: number;
    status: string;
}