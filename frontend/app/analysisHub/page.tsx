"use client";

import { MenuBar } from "@/components/analysisHub/menu-bar";
import { Sidebar } from "@/components/analysisHub/sidebar";
import { IntensityChart } from "@/components/analysisHub/intensityTab/intensity-chart";
import { StatusBar } from "@/components/analysisHub/status-bar";
import { AnalysisToolbar } from "@/components/analysisHub/intensityTab/analysis-toolbar";
import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import UploadPage from "../upload/page";
import { useAnalysisTab } from "@/contexts/analysisTabsContext/AnalysisTabsContext";
import GroupingTab from "@/components/analysisHub/grouping-tab/grouping-tab";
import RasterTab from "@/components/analysisHub/raster-tab/raster-tab";
import SpectraMap from "@/components/analysisHub/spectra-tab/spectra-map";
import PluginTab from "@/components/analysisHub/plugin-tab/PluginTab";
import { pluginService } from "@/services/pluginServices";
import { Plugin } from "@/types/plugin";
import ExportPanel from '@/components/analysisHub/export-tab/export-tab-panel';


export default function App() {
  const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false);
  const { activeTab } = useAnalysisTab();
  const [currentPlugin, setCurrentPlugin] = useState<Plugin | null>(null);

  const isPluginTab = activeTab.startsWith("plugin:");
  const pluginId = isPluginTab ? activeTab.replace("plugin:", "") : null;

  const isLoadingPlugin = isPluginTab && currentPlugin?.id !== pluginId;

  useEffect(() => {
    if (!pluginId) {
      return;
    }

    let cancelled = false;

    pluginService
      .getPlugin(pluginId)
      .then((response) => {
        if (!cancelled) {
          setCurrentPlugin(response.plugin ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) setCurrentPlugin(null);
      });

    return () => {
      cancelled = true;
    };
  }, [pluginId]);

  return (
    <div className="size-full flex flex-col bg-background text-foreground h-screen">
      <MenuBar onOpenFileUpload={() => setFileUploadModalOpen(true)} />
      <Modal
        open={fileUploadModalOpen}
        onClose={() => setFileUploadModalOpen(false)}
      >
        <UploadPage />
      </Modal>
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        {activeTab === "intensity" && (
          <div className="flex flex-col flex-1 min-w-0">
            <AnalysisToolbar />
            <div className="flex flex-1 gap-3 p-3 min-h-0">
              <IntensityChart />
            </div>
          </div>
        )}
        {activeTab === "grouping" && (
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex flex-1 gap-3 p-3 min-h-0">
              <GroupingTab />
            </div>
          </div>
        )}
        {activeTab === "raster" && (
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex flex-1 gap-3 p-3 min-h-0">
              <RasterTab />
            </div>
          </div>
        )}
        {activeTab === "spectra" && (
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex flex-1 gap-3 p-3 min-h-0">
              <SpectraMap />
            </div>
          </div>
        )}

        {isPluginTab && isLoadingPlugin && (
          <div className="flex flex-col flex-1 min-w-0 p-4">
            <div className="flex items-center justify-center h-full">
              <p className="text-foreground/40">Loading plugin...</p>
            </div>
          </div>
        )}

        {isPluginTab && !isLoadingPlugin && currentPlugin && (
          <div className="flex flex-col flex-1 min-w-0">
            <PluginTab plugin={currentPlugin} key={currentPlugin.id} />
          </div>
        )}

        {isPluginTab && !isLoadingPlugin && !currentPlugin && (
          <div className="flex flex-col flex-1 min-w-0 p-4">
            <div className="flex items-center justify-center h-full bg-card border border-border rounded-lg">
              <p className="text-foreground/40">Plugin not found</p>
            </div>
          </div>
        </div>)}
                {
          activeTab==="export" &&(<div className="flex flex-col flex-1 min-w-0">
          <div className="flex flex-1 gap-3 p-3 min-h-0">
            <ExportPanel />
          </div>
        </div>)}
      </div>
      <StatusBar />
    </div>
  );
}
