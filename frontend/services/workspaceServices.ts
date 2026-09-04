import axiosInstance from "@/lib/api/axiosInstance";
import {
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  WorkspacesResponse,
  WorkspaceResponse,
  WorkspaceUploadsResponse,
} from "@/types/workspace";

export const workspaceService = {
  getWorkspaces: async (): Promise<WorkspacesResponse> => {
    try {
      const response = await axiosInstance.get("/api/py/workspaces");
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || "Failed to fetch workspaces",
      );
    }
  },

  getWorkspace: async (workspaceId: string): Promise<WorkspaceResponse> => {
    try {
      const response = await axiosInstance.get(
        `/api/py/workspaces/${workspaceId}`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || "Failed to fetch workspace",
      );
    }
  },

  createWorkspace: async (
    request: CreateWorkspaceRequest,
  ): Promise<WorkspaceResponse> => {
    try {
      const response = await axiosInstance.post("/api/py/workspaces", request);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || "Failed to create workspace",
      );
    }
  },

  updateWorkspace: async (
    workspaceId: string,
    request: UpdateWorkspaceRequest,
  ): Promise<WorkspaceResponse> => {
    try {
      const response = await axiosInstance.put(
        `/api/py/workspaces/${workspaceId}`,
        request,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || "Failed to update workspace",
      );
    }
  },

  deleteWorkspace: async (workspaceId: string, user_id: string): Promise<WorkspaceResponse> => {
    try {
      const response = await axiosInstance.delete(
        `/api/py/workspaces/${workspaceId}`,
        {
          data: { user_id },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || "Failed to delete workspace",
      );
    }
  },

  archiveWorkspace: async (workspaceId: string): Promise<WorkspaceResponse> => {
    try {
      const response = await axiosInstance.patch(
        `/api/py/workspaces/${workspaceId}/archive`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || "Failed to archive workspace",
      );
    }
  },

  unarchiveWorkspace: async (
    workspaceId: string,
  ): Promise<WorkspaceResponse> => {
    try {
      const response = await axiosInstance.patch(
        `/api/py/workspaces/${workspaceId}/unarchive`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || "Failed to unarchive workspace",
      );
    }
  },


  getWorkspaceUploads: async (
    workspaceId: string,
  ): Promise<WorkspaceUploadsResponse> => {
    try {
      const response = await axiosInstance.patch(
        `/api/py/workspaces/${workspaceId}/uploads`,
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || "Failed to get workspace uploads",
      );
    }
  },

  deleteWorkspaceUpload: async (workspaceId: string, uploadId: string) => {
    try {
      const response = await axiosInstance.delete(
        `/api/py/workspaces/${workspaceId}/uploads/${uploadId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || "Failed to delete upload"
      );
    }
  },
};




