"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { MarketplacePlugin } from "@/types/marketplace";
import { useToast } from "@/contexts/toastContext/ToastContext";
import { marketplaceService } from "@/services/marketplaceService";
import { Card, CardContent } from "@/components/ui/Card";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import MarketplaceGrid from "@/components/marketplace/MarketplaceGrid";
import EmptyMarketplaceState from "@/components/marketplace/EmptyMarketplaceState";
import { Button } from "@/components/ui/Button";
import StatusFilterButton from "@/components/ui/StatusFilterButton";
import { Search, Filter, Plus } from "lucide-react";
import { useAuth } from "@/contexts/authContext/AuthContext";
import { useRouter } from "next/navigation";

type FilterOption = "all" | "installed" | "not_installed";

export default function MarketplacePage() {
  const { successToast, errorToast } = useToast();
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installedPluginIds, setInstalledPluginIds] = useState<string[]>([]);
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const { user } = useAuth();
  const router = useRouter();

  const fetchPlugins = useCallback(async () => {
    try {
      setLoading(true);
      const response = await marketplaceService.getMarketplacePlugins();
      if (response.success) {
        setPlugins(response.data || []);
      } else {
        console.log("failed to fetch marketplace plugins:", response.message);
        errorToast(response.message || "Failed to fetch marketplace plugins");
      }
    } catch (error: unknown) {
      console.error("Error fetching marketplace plugins;", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch marketplace plugins";
      errorToast(message);
    } finally {
      setLoading(false);
    }
  });

  const fetchInstalledPlugins = useCallback(async () => {
    try {
      const response = await pluginService.getPlugins();
      if (response.success && response.plugins) {
        const installedIds = response.plugins
          .filter((p) => p.source_plugin_id)
          .map((p) => p.source_plugin_id as string);
        setInstalledPluginIds(installedIds);
      }
    } catch (err) {
      console.error("Failed to fetch installed plugins:", err);
    }
  }, []);

  useEffect(() => {
    fetchPlugins();
  }, []);

  const filteredPlugins = useMemo(() => {
    let result = plugins.filter((plugin) => {
      if (!plugin) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = plugin.name?.toLowerCase().includes(query);
        const matchesDescription = plugin.description
          ?.toLowerCase()
          .includes(query);
        if (!matchesName && !matchesDescription) return false;
      }

      if (filterBy === "installed" && !installedPluginIds.includes(plugin.id)) {
        return false;
      }
      if (
        filterBy === "not_installed" &&
        (installedPluginIds.includes(plugin.id) || plugin.user_id === user?.id)
      ) {
        return false;
      }

      return true;
    });

    return result;
  }, [plugins, searchQuery, filterBy, installedPluginIds, user]);

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

  const hasPlugins = plugins.length > 0;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-foreground/60">Loading marketplace...</div>
        </div>
      );
    }

    if (hasPlugins) {
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
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                <input
                  type="text"
                  placeholder="Search marketplace..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-13 pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
              </div>

              <div className="flex gap-2">
                <StatusFilterButton
                  label="All"
                  value="all"
                  currentFilter={filterBy}
                  onClick={setFilterBy}
                  count={plugins.length}
                />
                <StatusFilterButton
                  label="Installed"
                  value="installed"
                  currentFilter={filterBy}
                  onClick={setFilterBy}
                  count={
                    plugins.filter((p) => installedPluginIds.includes(p.id))
                      .length
                  }
                />
                <StatusFilterButton
                  label="Not Installed"
                  value="not_installed"
                  currentFilter={filterBy}
                  onClick={setFilterBy}
                  count={
                    plugins.filter(
                      (p) =>
                        !installedPluginIds.includes(p.id) &&
                        p.user_id !== user?.id,
                    ).length
                  }
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => router.push("/plugins")}
                className="ml-auto"
              >
                Submit New Plugin
              </Button>
            </div>
            <p className="text-sm text-foreground/60 mb-4">
              Showing {filteredPlugins.length} of {plugins.length} plugins
            </p>
            {filteredPlugins.length > 0 ? (
              <MarketplaceGrid
                plugins={filteredPlugins}
                onInstall={handlePluginInstall}
                installingId={installingId}
                installedPluginIds={installedPluginIds}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 text-foreground/20 mx-auto mb-4" />
                  <p className="text-foreground/60">
                    No plugins match your search criteria
                  </p>
                </CardContent>
              </Card>
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
