import axiosInstance from "@/lib/api/axiosInstance";
import {
  MarketplacePluginsResponse,
  MarketplacePluginResponse,
  SubmitPluginResponse,
  InstallPluginResponse,
  SubmissionDetailsResponse,
} from "@/types/marketplace";

export const marketplaceService = {
  submitPlugin: async (pluginId: string): Promise<SubmitPluginResponse> => {
    try {
      const response = await axiosInstance.post(
        `api/py/plugins/marketplace/${pluginId}/submit`,
      );
      return response.data;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to submit plugin for marketplace review";
      throw new Error(message);
    }
  },

  cancelSubmission: async (pluginId: string): Promise<SubmitPluginResponse> => {
    try {
      const response = await axiosInstance.post(
        `api/py/plugins/marketplace/${pluginId}/cancel-submission`,
      );
      return response.data;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to cancel plugin submission";
      throw new Error(message);
    }
  },

  getMarketplacePlugins: async (): Promise<MarketplacePluginsResponse> => {
    try {
      const response = await axiosInstance.get("api/py/plugins/marketplace");
      return response.data;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch marketplace plugins";
      throw new Error(message);
    }
  },

  getMarketplacePlugin: async (
    pluginId: string,
  ): Promise<MarketplacePluginResponse> => {
    try {
      const response = await axiosInstance.get(
        `api/py/plugins/marketplace/${pluginId}`,
      );
      return response.data;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch marketplace plugin";
      throw new Error(message);
    }
  },

  installPlugin: async (pluginId: string): Promise<InstallPluginResponse> => {
    try {
      const response = await axiosInstance.post(
        `/api/py/plugins/marketplace/${pluginId}/install`,
      );
      return response.data;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to install plugin";
      throw new Error(message);
    }
  },

  getSubmissionDetails: async (
    pluginId: string,
  ): Promise<SubmissionDetailsResponse> => {
    try {
      const response = await axiosInstance.get(
        `/api/py/plugins/marketplace/${pluginId}/submission-details`,
      );
      return response.data;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch plugin submission details";
      throw new Error(message);
    }
  },

  getPluginsInReview: async (): Promise<MarketplacePluginsResponse> => {
    try {
      const response = await axiosInstance.get(
        `/api/py/plugins/marketplace/pending`,
      );
      return response.data;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch plugins in review";
      throw new Error(message);
    }
  },
};
