import { Plugin, PluginConfig } from "./plugin";

export type MarketPlaceStatus = "pending" | "approved" | "rejected" | null;

export type MarketplacePlugin = Plugin;

export interface MarketplacePluginResponse {
  success: boolean;
  data?: MarketplacePlugin;
  message?: string;
}

export interface MarketplacePluginsResponse {
  success: boolean;
  data?: MarketplacePlugin[];
  message?: string;
}

export interface SubmitPluginResponse {
  success: boolean;
  data?: MarketplacePlugin;
  message?: string;
}

export interface InstallPluginResponse {
  success: boolean;
  data?: Plugin;
  message?: string;
}

export interface SubmissionDetails {
  plugin_id: string;
  name: string;
  marketplace_status: MarketplaceStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  review_feedback: string | null;
  reviewer_email?: string | null;
}

export interface SubmissionDetailsResponse {
  success: boolean;
  data?: SubmissionDetails;
  message?: string;
}

export interface MarketplaceCardProps {
  plugin: MarketplacePlugin;
  onInstall: (pluginId: string) => Promise<void>;
  isInstalling?: boolean;
  isOwner?: boolean;
  isInstalled?: boolean;
}

export interface SubmissionStatusProps {
  status: MarketplaceStatus;
  feedback?: string | null;
  reviewedAt?: string | null;
}

export interface MarketplaceGridProps {
  plugins: MarketplacePlugin[];
  onInstall: (pluginId: string) => Promise<void>;
  installingId: string | null;
  installedPluginIds: string[];
}
