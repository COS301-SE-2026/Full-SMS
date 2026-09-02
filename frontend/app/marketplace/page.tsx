"use client";

import { useState, useMemo, useEffect } from "react";
import { MarketplacePlugin } from "@/types/marketplace";
import { useToast } from "@/contexts/toastContext/ToastContext";
import { marketplaceService } from "@/services/marketplaceService";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import EmptyMarketplaceState from "@/components/marketplace/EmptyMarketplaceState";
import { useAuth } from "@/contexts/authContext/AuthContext";
import { pluginService } from "@/services/pluginServices";
import { isAdmin } from "@/types/auth";
import MarketplaceContent from "@/components/marketplace/MarketplaceContent";
import PendingReviewContent from "@/components/marketplace/PendingReviewContent";

export default function MarketplacePage() {
  const { successToast, errorToast } = useToast();
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installedPluginIds, setInstalledPluginIds] = useState<string[]>([]);
  const { user } = useAuth();
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"marketplace" | "review">(
    "marketplace",
  );
  const userIsAdmin = isAdmin(user);
  const [pendingPlugins, setPendingPlugins] = useState<MarketplacePlugin[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);

        const marketplaceResponse =
          await marketplaceService.getMarketplacePlugins();
        if (
          isMounted &&
          marketplaceResponse.success &&
          marketplaceResponse.data
        ) {
          setPlugins(marketplaceResponse.data);
        } else if (isMounted && !marketplaceResponse.success) {
          errorToast(
            marketplaceResponse.message ||
              "Failed to fetch marketplace plugins",
          );
        }

        const installedResponse = await pluginService.getPlugins();
        if (
          isMounted &&
          installedResponse.success &&
          installedResponse.plugins
        ) {
          const installedIds = installedResponse.plugins
            .filter((p) => p.source_plugin_id)
            .map((p) => p.source_plugin_id as string);
          setInstalledPluginIds(installedIds);
        }

        if (userIsAdmin) {
          try {
            const pendingResponse =
              await marketplaceService.getPluginsInReview();
            if (isMounted && pendingResponse.success && pendingResponse.data) {
              setPendingPlugins(pendingResponse.data);
            }
          } catch (err) {
            console.error("Failed to fetch pending plugins:", err);
          }
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        if (isMounted) {
          errorToast(
            err instanceof Error
              ? err.message
              : "Failed to fetch marketplace data",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [errorToast]);

  const refreshMarketplace = async () => {
    try {
      const response = await marketplaceService.getMarketplacePlugins();
      if (response.success && response.data) {
        setPlugins(response.data);
      }
    } catch (err) {
      console.error("Failed to refresh marketplace:", err);
    }
  };

  const handlePluginInstall = async (pluginId: string) => {
    try {
      setInstallingId(pluginId);
      const response = await marketplaceService.installPlugin(pluginId);
      if (response.success) {
        successToast("Plugin installed successfully");
        setInstalledPluginIds((prev) => [...prev, pluginId]);
      } else {
        console.log("failed to installplugin:", response.message);
        errorToast(response.message || "Failed to install plugin");
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Failed to install plugin:", err);
      errorToast(
        err instanceof Error ? err.message : "Failed to install plugin",
      );
    } finally {
      setInstallingId(null);
    }
  };

  const handleApprove = async (pluginId: string) => {
    try {
      setApprovingId(pluginId);
      const response = await marketplaceService.approvePlugin(pluginId);
      if (response.success) {
        successToast("Plugin approved successfully");
        setPendingPlugins((prev) => prev.filter((p) => p.id !== pluginId));
        refreshMarketplace();
      } else {
        errorToast(response.message || "Failed to approve plugin");
      }
    } catch (err) {
      console.error("Failed to approve plugin:", err);
      errorToast(
        err instanceof Error ? err.message : "Failed to approve plugin",
      );
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (pluginId: string, feedback: string) => {
    try {
      setRejectingId(pluginId);
      const response = await marketplaceService.rejectPlugin(
        pluginId,
        feedback,
      );
      if (response.success) {
        successToast("Plugin rejected");
        setPendingPlugins((prev) => prev.filter((p) => p.id !== pluginId));
      } else {
        errorToast(response.message || "Failed to reject plugin");
      }
    } catch (err) {
      console.error("Failed to reject plugin:", err);
      errorToast(
        err instanceof Error ? err.message : "Failed to reject plugin",
      );
    } finally {
      setRejectingId(null);
    }
  };

  const hasPlugins = plugins.length > 0;
  const hasPendingPlugins = pendingPlugins.length > 0;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-foreground/60">Loading marketplace...</div>
        </div>
      );
    }

    const showContent = hasPlugins || (userIsAdmin && hasPendingPlugins);

    if (showContent) {
      return (
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Plugin Marketplace
              </h1>
              <p className="text-foreground/60">
                Discover and install plugins created by the community
              </p>
            </div>

            {userIsAdmin && (
              <div className="flex gap-1 mb-8 border-b border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab("marketplace")}
                  className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === "marketplace"
                      ? "border-primary text-primary"
                      : "border-transparent text-foreground/60 hover:text-foreground"
                  }`}
                >
                  Marketplace
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("review")}
                  className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
                    activeTab === "review"
                      ? "border-primary text-primary"
                      : "border-transparent text-foreground/60 hover:text-foreground"
                  }`}
                >
                  Pending Review
                  {pendingPlugins.length > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium flex items-center justify-center bg-primary/30 text-warning-foreground">
                      {pendingPlugins.length}
                    </span>
                  )}
                </button>
              </div>
            )}

            {activeTab === "marketplace" || !userIsAdmin ? (
              <MarketplaceContent
                plugins={plugins}
                installedPluginIds={installedPluginIds}
                installingId={installingId}
                onInstall={handlePluginInstall}
              />
            ) : (
              <PendingReviewContent
                pendingPlugins={pendingPlugins}
                approvingId={approvingId}
                rejectingId={rejectingId}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            )}
          </div>
        </div>
      );
    }
    return <EmptyMarketplaceState />;
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <DashboardSidebar activeItem="marketplace" />
      <main className="flex-1 flex flex-col min-w-0">{renderContent()}</main>
    </div>
  );
}
