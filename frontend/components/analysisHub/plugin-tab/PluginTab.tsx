"use client";

import { useState, useEffect, useRef } from "react";
import { Plugin, PluginExecutionState } from "@/types/plugin";
import { pluginService } from "@/services/pluginServices";
import { useToast } from "@/contexts/toastContext/ToastContext";
import {
  useHdf5Data,
  CachedPluginResult,
} from "@/contexts/hdf5Context/Hdf5DataContext";
import { formatDate } from "@/utils/dateTime";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import ParameterForm from "@/components/plugins/ParameterForm";
import ResultsRenderer from "@/components/plugins/renderers/ResultsRenderer";
import ExportModal from "@/components/plugins/ExportModal";
import { Play, History, CheckCircle, Clock, Download } from "lucide-react";

interface PluginTabProps {
  plugin: Plugin;
}

function getDefaultValues(plugin: Plugin): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const param of plugin.config.parameters) {
    if (param.default !== undefined) {
      defaults[param.id] = param.default;
    }
  }
  return defaults;
}

export default function PluginTab({ plugin }: Readonly<PluginTabProps>) {
  const { errorToast, successToast } = useToast();
  const {
    currentWorkspaceId,
    currentUpload,
    currentMeasurement,
    getPluginResult,
    setPluginResult,
  } = useHdf5Data();
  const [params, setParams] = useState<Record<string, unknown>>(() =>
    getDefaultValues(plugin),
  );
  const [execution, setExecution] = useState<PluginExecutionState>({
    status: "idle",
  });
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [lastExecutedAt, setLastExecutedAt] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    setParams(getDefaultValues(plugin));
  }, [plugin.id]);

  useEffect(() => {
    const loadResult = async () => {
      if (!currentWorkspaceId || !currentMeasurement) return;

      const cacheKey = `${plugin.id}-${currentWorkspaceId}-${currentMeasurement}`;

      const cached = getPluginResult(
        plugin.id,
        currentWorkspaceId,
        currentMeasurement,
      );
      if (cached) {
        if (cached.status === "success") {
          setExecution({
            status: "success",
            results: cached.results,
            isPreviousResult: true,
            executionId: cached.executionId,
          });
          setExecutionTime(cached.executionTimeMs || null);
          setLastExecutedAt(cached.executedAt);
          if (cached.parameters) {
            setParams((prev) => ({
              ...prev,
              ...cached.parameters,
            }));
          }
        } else {
          setExecution({ status: "idle" });
        }
        return;
      }

      if (fetchedRef.current === cacheKey) return;

      try {
        setExecution({ status: "loading" });
        fetchedRef.current = cacheKey;

        const response = await pluginService.getLatestExecution(
          plugin.id,
          currentWorkspaceId,
          currentMeasurement,
        );

        if (response.execution?.status === "success") {
          const result: CachedPluginResult = {
            status: "success",
            results: response.execution.results,
            executionTimeMs: response.execution.execution_time_ms,
            executedAt: response.execution.created_at,
            parameters: response.execution.parameters,
            executionId: response.execution.id,
          };
          setPluginResult(
            plugin.id,
            currentWorkspaceId,
            currentMeasurement,
            result,
          );

          setExecution({
            status: "success",
            results: response.execution.results,
            isPreviousResult: true,
            executionId: response.execution.id,
          });
          setExecutionTime(response.execution.execution_time_ms || null);
          setLastExecutedAt(response.execution.created_at);
          if (response.execution.parameters) {
            setParams((prev) => ({
              ...prev,
              ...response.execution!.parameters,
            }));
          }
        } else {
          setExecution({ status: "idle" });
        }
      } catch {
        setExecution({ status: "idle" });
      }
    };

    loadResult();
  }, [
    plugin.id,
    currentWorkspaceId,
    currentMeasurement,
    getPluginResult,
    setPluginResult,
  ]);

  const handleRun = async () => {
    setExecution({ status: "running" });
    setExecutionTime(null);

    const measurementId =
      currentMeasurement && currentMeasurement !== "0"
        ? currentMeasurement
        : "1";

    try {
      const response = await pluginService.executePlugin(plugin.id, {
        parameters: params,
        workspace_id: currentWorkspaceId || undefined,
        measurement_id: measurementId,
        upload_id: currentUpload || undefined,
      });

      if (response.success) {
        const executedAt = new Date().toISOString();

        if (currentWorkspaceId) {
          const cachedResult: CachedPluginResult = {
            status: "success",
            results: response.results,
            executionTimeMs: response.execution_time_ms,
            executedAt,
            parameters: params,
            executionId: response.execution_id,
          };
          setPluginResult(
            plugin.id,
            currentWorkspaceId,
            measurementId,
            cachedResult,
          );
        }

        setExecution({
          status: "success",
          results: response.results,
          isPreviousResult: false,
          executionId: response.execution_id,
        });
        setExecutionTime(response.execution_time_ms || null);
        setLastExecutedAt(executedAt);
        successToast("Plugin executed successfully");
      } else {
        setExecution({
          status: "error",
          error: response.error || "Execution failed",
        });
        errorToast(response.error || "Plugin execution failed");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to execute plugin";
      setExecution({ status: "error", error: message });
      errorToast(message);
    }
  };

  const canExport =
    execution.status === "success" &&
    execution.results &&
    execution.executionId;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 min-h-12 py-2 px-4 border-b border-border bg-background flex-wrap overflow-visible relative z-10">
        <h3 className="text-foreground font-medium">{plugin.name}</h3>

        <ParameterForm
          parameters={plugin.config.parameters}
          values={params}
          onChange={setParams}
          workspaceId={currentWorkspaceId || undefined}
          measurementId={currentMeasurement || undefined}
        />

        <Button
          size="sm"
          variant="primary"
          leftIcon={
            execution.status === "running" ? (
              <Loader size="sm" />
            ) : (
              <Play size={14} fill="currentColor" />
            )
          }
          className="min-h-[28px] px-3"
          onClick={handleRun}
          disabled={execution.status === "running" || !plugin.enabled}
        >
          {execution.status === "running" ? "Running..." : "Run Analysis"}
        </Button>

        {canExport && (
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Download size={14} />}
            className="min-h-[28px] px-3"
            onClick={() => setShowExportModal(true)}
          >
            Export
          </Button>
        )}

        {execution.status === "success" && (
          <div className="flex items-center gap-2 text-xs text-foreground/60 ml-auto">
            {execution.isPreviousResult ? (
              <>
                <History className="h-3 w-3 text-blue-500" />
                <span>Previous result</span>
                {lastExecutedAt && (
                  <span>({formatDate(lastExecutedAt, true)})</span>
                )}
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Success</span>
              </>
            )}
            {executionTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {executionTime}ms
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 p-4 min-h-0 overflow-auto relative z-0">
        {execution.status === "idle" && (
          <Card className="flex items-center justify-center h-full">
            <p className="text-sm text-foreground/40">
              Configure parameters and click Run Analysis to see results.
            </p>
          </Card>
        )}

        {execution.status === "loading" && (
          <Card className="flex items-center justify-center h-full">
            <Loader centered size="md" label="Loading previous results..." />
          </Card>
        )}

        {execution.status === "running" && (
          <Card className="flex items-center justify-center h-full">
            <Loader centered size="md" label="Executing plugin..." />
          </Card>
        )}

        {execution.status === "error" && (
          <Card className="p-4">
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <p className="text-sm text-destructive">{execution.error}</p>
            </div>
          </Card>
        )}

        {execution.status === "success" && execution.results && (
          <Card className="p-4 h-full">
            <ResultsRenderer
              outputs={plugin.config.outputs}
              results={execution.results}
            />
          </Card>
        )}
      </div>

      {canExport && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          executionId={execution.executionId!}
          outputs={plugin.config.outputs}
          results={execution.results!}
          pluginName={plugin.name}
        />
      )}
    </div>
  );
}
