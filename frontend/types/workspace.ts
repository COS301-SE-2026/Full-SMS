import { UploadRecord } from "./hdf5";

export type WorkspaceStatus = "active" | "archived";

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  storage_bucket_path: string | null;
  status: WorkspaceStatus;
  created_at: string;
  updated_at: string;
  file_count: number;
}

export interface WorkspaceTableRow {
  id: string;
  name: string;
  description: string | null;
  status: WorkspaceStatus;
  created_at: string;
  updated_at: string;
  file_count: number;
}

export interface WorkspaceFile {
  id: string;
  workspace_id: string;
  file_name: string;
  file_path: string;
  file_size_bytes: number | null;
  file_type: string | null;
  uploaded_at: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
  status?: WorkspaceStatus;
}

export interface WorkspaceResponse {
  success: boolean;
  workspace?: Workspace;
  message?: string;
}

export interface WorkspacesResponse {
  success: boolean;
  workspaces?: Workspace[];
  message?: string;
}

export interface WorkspaceTableProps {
  workspaces: WorkspaceTableRow[];
  onOpen: (workspaceId: string) => void;
  onDelete: (workspaceId: string) => void;
  onArchive: (workspaceId: string) => void;
  onUnarchive: (workspaceId: string) => void;
}

export interface WorkspaceUploadsResponse {
  success: boolean;
  uploads?: UploadRecord[];
  message?: string;
}