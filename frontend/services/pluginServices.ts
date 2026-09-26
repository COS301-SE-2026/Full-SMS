import axiosInstance from "@/lib/api/axiosInstance";
import {
  PluginResponse,
  PluginsResponse,
  CreatePluginRequest,
  UpdatePluginRequest,
  ExecutePluginRequest,
  ExecutePluginResponse,
  LatestExecutionResponse,
  AvailableOutputsResponse,
  ExportFormat,
} from "@/types/plugin";

export const pluginService = {
  getPlugins: async (): Promise<PluginsResponse> => {
    try {
      const response =
        await axiosInstance.get<PluginsResponse>("/api/py/plugins");
      return response.data;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch plugins";
      throw new Error(message);
    }
  },
  getPlugin: async (pluginId: string): Promise<PluginResponse> => {
    try {
      const response = await axiosInstance.get<PluginResponse>(
        `/api/py/plugins/${pluginId}`,
      );
      return response.data;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch plugin";
      throw new Error(message);
    }
  },

  createPlugin: async (
    pluginData: CreatePluginRequest,
  ): Promise<PluginResponse> => {
    try {
      const response = await axiosInstance.post<PluginResponse>(
        "/api/py/plugins",
        pluginData,
      );
      return response.data;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to create plugin";
      throw new Error(message);
    }
  },

  updatePlugin: async (
    pluginId: string,
    pluginData: UpdatePluginRequest,
  ): Promise<PluginResponse> => {
    try {
      const response = await axiosInstance.put<PluginResponse>(
        `/api/py/plugins/${pluginId}`,
        pluginData,
      );
      return response.data;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update plugin";
      throw new Error(message);
    }
  },

  deletePlugin: async (pluginId: string): Promise<PluginResponse> => {
    try {
      const response = await axiosInstance.delete<PluginResponse>(
        `/api/py/plugins/${pluginId}`,
      );
      return response.data;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to delete plugin";
      throw new Error(message);
    }
  },

  togglePlugin: async (
    pluginId: string,
    enabled: boolean,
  ): Promise<PluginResponse> => {
    try {
      const response = await axiosInstance.patch<PluginResponse>(
        `/api/py/plugins/${pluginId}/toggle`,
        { enabled },
      );
      console.log("Raw axios response:", response);
      console.log("Response data:", response.data);
      return response.data;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to toggle plugin";
      throw new Error(message);
    }
  },

  executePlugin: async (
    pluginId: string,
    pluginData: ExecutePluginRequest,
  ): Promise<ExecutePluginResponse> => {
    try {
      const response = await axiosInstance.post<ExecutePluginResponse>(
        `/api/py/plugins/${pluginId}/execute`,
        pluginData,
      );
      return response.data;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to execute plugin";
      throw new Error(message);
    }
  },

  updateFromMarketplace: async (pluginId: string): Promise<PluginResponse> => {
    try {
      const response = await axiosInstance.patch(
        `/api/py/plugins/${pluginId}/update-from-marketplace`,
      );
      return response.data;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update plugin from marketplace";
      throw new Error(message);
    }
  },
  getLatestExecution: async (
    pluginId: string,
    workspaceId: string,
    measurementId: string,
  ): Promise<LatestExecutionResponse> => {
    try {
      const response = await axiosInstance.get<LatestExecutionResponse>(
        `/api/py/plugins/${pluginId}/executions/latest`,
        {
          params: { workspace_id: workspaceId, measurement_id: measurementId },
        },
      );
      return response.data;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch latest execution";
      throw new Error(message);
    }
  },

  exportOutput: async (
    executionId: string,
    outputId: string,
    format: ExportFormat,
  ): Promise<Blob> => {
    try {
      const response = await axiosInstance.post(
        "/api/py/plugins/export",
        { execution_id: executionId, output_id: outputId, format },
        { responseType: "blob" },
      );
      return response.data;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to export output";
      throw new Error(message);
    }
  },

  exportAllOutputs: async (
    executionId: string,
    format: ExportFormat,
  ): Promise<Blob> => {
    try {
      const response = await axiosInstance.post(
        "/api/py/plugins/export/all",
        { execution_id: executionId, format },
        { responseType: "blob" },
      );
      return response.data;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to export outputs";
      throw new Error(message);
    }
  },

  getAvailableOutputs: async (
    workspaceId: string,
    measurementId: string,
    acceptedTypes?: string[],
    acceptedPluginIds?: string[],
  ): Promise<AvailableOutputsResponse> => {
    try {
      const params: Record<string, string> = {
        workspace_id: workspaceId,
        measurement_id: measurementId,
      };
      if (acceptedTypes?.length) {
        params.accepted_types = acceptedTypes.join(",");
      }
      if (acceptedPluginIds?.length) {
        params.accepted_plugin_ids = acceptedPluginIds.join(",");
      }
      const response = await axiosInstance.get<AvailableOutputsResponse>(
        "/api/py/plugins/outputs/available",
        {
          params,
        },
      );
      return response.data;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch available outputs";
      throw new Error(message);
    }
  },
};

export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();  // Changed from: document.body.removeChild(link)
    URL.revokeObjectURL(url);
  }
