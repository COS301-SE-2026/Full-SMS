import axiosInstance from "@/lib/api/axiosInstance";
import {
  PluginResponse,
  PluginsResponse,
  CreatePluginRequest,
  UpdatePluginRequest,
  ExecutePluginRequest,
  ExecutePluginResponse,
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
  }
};
