import React, { useEffect } from "react";
import {
  Activity,
  Clock,
  Layers,
  GitCompare,
  Waves,
  Grid3x3,
  Download,
  ChevronLeft,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MeasurementsBar } from "./measurementsBar";
import { useAnalysisTab } from "@/contexts/analysisTabsContext/AnalysisTabsContext";
import { pluginService } from "@/services/pluginServices";
import { Plugin } from "@/types/plugin";
import { useToast } from "@/contexts/toastContext/ToastContext";

const navItems = [
  { icon: Activity, label: "Intensity", key: "intensity" },
  { icon: Layers, label: "Grouping", key: "grouping" },
  { icon: Grid3x3, label: "Raster", key: "raster" },
  { icon: Waves, label: "Spectra", key: "spectra" },
];

export function Sidebar() {
  const { activeTab, setActiveTab } = useAnalysisTab();
  const [plugins, setPlugins] = React.useState<Plugin[]>([]);
  const { errorToast } = useToast();

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

  return (
    <aside className="flex flex-col w-[195px] shrink-0 border-r border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between h-[49px] px-3.5 border-b border-border">
        <h3 className="text-foreground">FullSMS</h3>
        <button
          className="p-1 rounded hover:bg-card text-foreground/70"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft size={16} />
        </button>
      </div>
      <nav className="flex flex-col py-1">
        {navItems.map(({ icon: Icon, label, key }) => {
          const isActive = key === activeTab;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-background"
                  : "text-foreground hover:bg-card",
              )}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          );
        })}
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
      <MeasurementsBar />
    </aside>
  );
}
