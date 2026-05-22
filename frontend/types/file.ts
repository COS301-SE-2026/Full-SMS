export interface SelectedFile {
  id: string
  file: File
  name: string
  sizeBytes: number
  progress: number
  status: 'idle' | 'pending' | 'success' | 'error'
  errorMessage?: string
}