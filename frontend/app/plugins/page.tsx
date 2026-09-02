"use client";

import { useState, useMemo, useEffect } from "react";
import { Plugin, CreatePluginRequest } from "@/types/plugin";
import { useToast } from "@/contexts/toastContext/ToastContext";
import { pluginService } from "@/services/pluginServices";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import Sidebar from "@/components/dashboard/Sidebar";
import PluginTable from "@/components/plugins/PluginTable";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import EmptyPluginState from "@/components/plugins/EmptyPluginState";
import PluginEditorModal from "@/components/plugins/PluginEditorModal";
import StatusFilterButton from "@/components/ui/StatusFilterButton";
import { Plus, Search } from "lucide-react";
import { Loader } from "@/components/ui/Loader";
import { marketplaceService } from "@/services/marketplaceService";

type PluginFilter = "all" | "enabled" | "disabled";

export default function PluginsPage() {
  const { successToast, errorToast } = useToast();

  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PluginFilter>("all");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPlugin, setEditingPlugin] = useState<Plugin | undefined>(
    undefined,
  );
  const [pluginToDelete, setPluginToDelete] = useState<Plugin | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlugins = async () => {
      setLoading(true);
      try {
        const response = await pluginService.getPlugins();
        if (response?.success && response?.plugins) {
          const enabledPlugins = response.plugins.filter(
            (plugin) => plugin.enabled,
          );
          setPlugins(enabledPlugins);
        }
      } catch (error) {
        errorToast("Failed to fetch plugins");
        console.error("Error fetching plugins:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlugins();
  }, [errorToast]);

  const filteredPlugins = useMemo(() => {
    return plugins?.filter((plugin) => {
      if (statusFilter === "enabled" && !plugin.enabled) return false;
      if (statusFilter === "disabled" && plugin.enabled) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = plugin.name.toLowerCase().includes(query);
        const matchesDescription = plugin.description
          ?.toLowerCase()
          .includes(query);
        if (!matchesName && !matchesDescription) return false;
      }

      return true;
    });
  }, [plugins, statusFilter, searchQuery]);

  const handleCreateNew = () => {
    setEditingPlugin(undefined);
    setIsEditorOpen(true);
  };

  const handleEdit = (plugin: Plugin) => {
    setEditingPlugin(plugin);
    setIsEditorOpen(true);
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setEditingPlugin(undefined);
  };

  const handleSave = async (data: CreatePluginRequest) => {
    try {
      setLoading(true);
      if (editingPlugin) {
        const response = await pluginService.updatePlugin(
          editingPlugin.id,
          data,
        );
        console.log("Updating plugin response:", response);

        if (response?.success && response?.plugin) {
          const updatedPlugin = response.plugin;
          setPlugins((prev) =>
            prev.map((p) => (p.id === editingPlugin.id ? updatedPlugin : p)),
          );
          successToast("Plugin updated successfully");
        } else {
          errorToast(response.message || "Failed to update plugin");
        }
      } else {
        const response = await pluginService.createPlugin(data);
        if (response?.success && response?.plugin) {
          const newPlugin = response.plugin;
          setPlugins((prev) => [newPlugin, ...prev]);
          successToast("Plugin created successfully");
        } else {
          errorToast(response.message || "Failed to create plugin");
        }
      }
      handleEditorClose();
    } catch (error) {
      console.error("Failed to save plugin", error);
      errorToast("Failed to save plugin");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (plugin: Plugin) => {
    try {
      setLoading(true);
      const response = await pluginService.togglePlugin(
        plugin?.id,
        !plugin?.enabled,
      );
      if (response?.success && response?.plugin) {
        const toggledPlugin = response.plugin;
        setPlugins((prev) =>
          prev.map((p) => (p.id === plugin.id ? toggledPlugin : p)),
        );
        successToast(
          `Plugin ${plugin.enabled ? "disabled" : "enabled"} successfully`,
        );
      } else {
        errorToast(
          response?.message ||
            `Failed to ${plugin.enabled ? "disable" : "enable"} plugin`,
        );
      }
    } catch (error) {
      console.error("Failed to toggle plugin", error);
      errorToast(`Failed to ${plugin.enabled ? "disable" : "enable"} plugin`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!pluginToDelete) return;
    try {
      setLoading(true);
      const response = await pluginService.deletePlugin(pluginToDelete.id);
      if (response?.success) {
        setPlugins((prev) => prev.filter((p) => p.id !== pluginToDelete.id));
        successToast("Plugin deleted successfully");
      } else {
        errorToast(response?.message || "Failed to delete plugin");
      }
    } catch (error) {
      console.error("Failed to delete plugin", error);
      errorToast("Failed to delete plugin");
    } finally {
      setLoading(false);
      setPluginToDelete(null);
    }
  };

  const handleSubmitToMarketplace = async (plugin: Plugin) => {
    try {
      setSubmittingId(plugin.id);
      const response = await marketplaceService.submitPlugin(plugin.id);
      if (response.success && response.data) {
        setPlugins((prev) =>
          prev.map((p) => (p.id === plugin.id ? response.data! : p)),
        );
        successToast("Plugin submitted for marketplace review");
      } else {
        errorToast(response.message || "Failed to submit plugin");
      }
    } catch (err) {
      console.error("Failed to submit plugin:", err);
      errorToast(
        err instanceof Error ? err.message : "Failed to submit plugin",
      );
    } finally {
      setSubmittingId(null);
    }
  };

  const handleCancelSubmission = async (plugin: Plugin) => {
    try {
      setCancellingId(plugin.id);
      const response = await marketplaceService.cancelSubmission(plugin.id);
      if (response.success && response.data) {
        setPlugins((prev) =>
          prev.map((p) => (p.id === plugin.id ? response.data! : p)),
        );
        successToast("Marketplace submission cancelled");
      } else {
        errorToast(response.message || "Failed to cancel submission");
      }
    } catch (err) {
      console.error("Failed to cancel submission:", err);
      errorToast(
        err instanceof Error ? err.message : "Failed to cancel submission",
      );
    } finally {
      setCancellingId(null);
    }
  };

  const handleUpdateFromMarketplace = async (plugin: Plugin) => {
    try {
      setUpdatingId(plugin.id);
      const response = await pluginService.updateFromMarketplace(plugin.id);
      if (response.success && response.plugin) {
        setPlugins((prev) =>
          prev.map((p) => (p.id === plugin.id ? response.plugin! : p)),
        );
        successToast("Plugin has been updated to the latest marketplace version");
      } else {
        errorToast(response.message || "Failed to update plugin");
      }
    } catch (err) {
      console.error("Failed to update plugin from marketplace:", err);
      errorToast(
        err instanceof Error ? err.message : "Failed to update plugin",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const hasPlugins = plugins?.length > 0;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col flex-1 p-6 overflow-auto">
          <div className="flex-1 flex items-center justify-center">
            <Loader centered size="lg" label="Loading your plugins..." />
          </div>
        </div>
      );
    }
    if (hasPlugins) {
      return (
        <div className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground mb-1">
              Plugins
            </h1>
            <p className="text-foreground/60 text-sm">
              Create and manage custom analysis plugins
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
              <input
                type="text"
                placeholder="Search plugins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-13 pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <StatusFilterButton
                label="All"
                value="all"
                currentFilter={statusFilter}
                onClick={setStatusFilter}
                count={plugins.length}
              />
              <StatusFilterButton
                label="Enabled"
                value="enabled"
                currentFilter={statusFilter}
                onClick={setStatusFilter}
                count={plugins.filter((p) => p.enabled).length}
              />
              <StatusFilterButton
                label="Disabled"
                value="disabled"
                currentFilter={statusFilter}
                onClick={setStatusFilter}
                count={plugins.filter((p) => !p.enabled).length}
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleCreateNew}
              className="ml-auto"
            >
              New Plugin
            </Button>
          </div>

          <p className="text-sm text-foreground/60 mb-4">
            Showing {filteredPlugins.length} of {plugins.length} plugins
          </p>

          {filteredPlugins.length > 0 ? (
            <PluginTable
              plugins={filteredPlugins}
              onEdit={handleEdit}
              onToggle={handleToggle}
              onDelete={setPluginToDelete}
              onSubmitToMarketplace={handleSubmitToMarketplace}
              onCancelSubmission={handleCancelSubmission}
              onUpdateFromMarketplace={handleUpdateFromMarketplace}
              submittingId={submittingId}
              cancellingId={cancellingId}
              updatingId={updatingId}
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
      );
    }

    return <EmptyPluginState onCreatePlugin={handleCreateNew} />;
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar activeItem="plugins" />
      <main className="flex-1 flex flex-col min-w-0">{renderContent()}</main>

      <PluginEditorModal
        isOpen={isEditorOpen}
        plugin={editingPlugin}
        onClose={handleEditorClose}
        onSave={handleSave}
      />

      <ConfirmDeleteModal
        isOpen={!!pluginToDelete}
        itemName={pluginToDelete?.name || ""}
        itemType="plugin"
        onClose={() => setPluginToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
