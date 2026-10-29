"use client";

import React, { useEffect } from "react";
import {
  Activity,
  Layers,
  Waves,
  Grid3x3,
  Download,
  ChevronLeft,
  Clock,
  Code,
  Grip,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MeasurementsBar } from "./measurementsBar";
import { useAnalysisTab } from "@/contexts/analysisTabsContext/AnalysisTabsContext";
import { Panel, Group } from "react-resizable-panels";
import { pluginService } from "@/services/pluginServices";
import { Plugin } from "@/types/plugin";
import { useToast } from "@/contexts/toastContext/ToastContext";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";

const navItems = [
  { icon: Activity, label: "Intensity", key: "intensity" },
  { icon: Clock, label: "Lifetime", key: "lifetime" },
  { icon: Layers, label: "Grouping", key: "grouping" },
  { icon: Grid3x3, label: "Raster", key: "raster" },
  { icon: Waves, label: "Spectra", key: "spectra" },
  { icon: Grip, label: "Correlation", key: "correlation" },
  { icon: Download, label: "Export", key: "export" },
];

const nativeNavItems = [
  { icon: Clock, label: "Lifetime", key: "lifetime" },
  { icon: Download, label: "Export", key: "export" },
];

export function Sidebar() {
  const { activeTab, setActiveTab } = useAnalysisTab();
  const [plugins, setPlugins] = React.useState<Plugin[]>([]);
  const { errorToast } = useToast();
  const { hdf5Metadata } = useHdf5Data();

  useEffect(() => {
    if (hdf5Metadata?.data_kind === "native_data") {
      setActiveTab("lifetime");
    }
  }, []);

  useEffect(() => {
    const fetchPlugins = async () => {
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
      }
    };
    fetchPlugins();
  }, [errorToast]);

  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col shrink-0 border-r border-border bg-background transition-[width] duration-200",
        collapsed ? "w-14" : "w-[195px]",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center h-[49px]",
          collapsed ? "justify-center px-0" : "justify-between px-3.5",
        )}
      >
        {!collapsed && <h3 className="text-foreground">FullSMS</h3>}
        <button
          type="button"
          className="shrink-0 p-1 rounded hover:bg-primary/20 text-foreground/70"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <Group orientation="vertical">
        <Panel>
          <nav className="flex flex-col py-1 overflow-y-auto h-full">
            {(hdf5Metadata?.data_kind === "native_data"
              ? nativeNavItems
              : navItems
            ).map(({ icon: Icon, label, key }) => {
              const isActive = key === activeTab;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  type="button"
                  className={cn(
                    "flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-background"
                      : "text-foreground hover:bg-card",
                  )}
                >
                  <Icon size={18} />
                  {!collapsed && <span>{label}</span>}
                </button>
              );
            })}

            {/* Plugins Section from develop */}
            {plugins.length > 0 && (
              <>
                <div className="px-3.5 py-2 mt-6 border-t border-border">
                  <span className="text-xs font-medium text-foreground/40 uppercase tracking-wider">
                    Plugins ({plugins.length})
                  </span>
                </div>
                <div className="mb-6">
                  {plugins.map((plugin) => {
                    const isActive = activeTab === `plugin:${plugin.id}`;
                    return (
                      <button
                        key={plugin.id}
                        onClick={() => setActiveTab(`plugin:${plugin.id}`)}
                        className={cn(
                          "flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors w-full",
                          isActive
                            ? "bg-primary text-background"
                            : "text-foreground hover:bg-card",
                        )}
                      >
                        <Code size={18} className="shrink-0" />
                        <span className="truncate">{plugin.name}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </nav>
        </Panel>

        {!collapsed && (<Panel>
          <MeasurementsBar />
        </Panel>)}
      </Group>
    </aside>
  );
}
