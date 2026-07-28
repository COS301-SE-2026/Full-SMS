"use client";

import { useState, useEffect } from "react";
import { Plugin, PluginExecutionState, PluginTabProps } from "@/types/plugin";
import { useToast } from "@/contexts/toastContext/ToastContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import { AlertCircle, Play, History, CheckCircle, Clock } from "lucide-react";
import ParameterForm from "@/components/plugins/ParameterForm";
import ResultsRenderer from "@/components/plugins/renderers/ResultsRenderer";
import { pluginService } from "@/services/pluginServices";
import { formatDate } from "@/utils/dateTime";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";

function getDefaultValues(plugin: Plugin): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const param of plugin.config.parameters) {
    if (param.default !== undefined) {
      defaults[param.id] = param.default;
    }
  }
  return defaults;
}

export default function PluginTab({ plugin }: PluginTabProps) {
  const { successToast, errorToast } = useToast();
  const [params, setParams] = useState<Record<string, unknown>>(
    getDefaultValues(plugin),
  );
  const [execution, setExecution] = useState<PluginExecutionState>({
    status: "idle",
  });
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [lastExecutedAt, setLastExecutedAt] = useState<string | null>(null);
  const { currentWorkspaceId, currentUpload, currentMeasurement } =
    useHdf5Data();

  useEffect(() => {
    setParams(getDefaultValues(plugin));
    setExecution({ status: "idle" });
    setExecutionTime(null);
    setLastExecutedAt(null);
  }, [plugin.id]);

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

      console.log("comeeeeeee onnnnnnnn", response);

      if (response.success) {
        setExecution({
          status: "success",
          results: response.results,
          isPreviousResult: false,
        });
        setExecutionTime(response.execution_time_ms || null);
        setLastExecutedAt(new Date().toISOString());
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 h-12 px-4 border-b border-border bg-background flex-wrap">
        <h3 className="text-foreground">{plugin.name}</h3>
        <ParameterForm
          parameters={plugin.config.parameters}
          values={params}
          onChange={setParams}
        />
        <Button
          size="sm"
          variant="primary"
          leftIcon={
            execution.status === "running" ? (
              <Loader size="sm" />
            ) : (
              <Play size={15.5} fill="currentColor" />
            )
          }
          className="min-h-[28px] px-3"
          onClick={handleRun}
          disabled={execution.status === "running" || !plugin.enabled}
        >
          {execution.status === "running" ? "Running..." : "Run Analysis"}
        </Button>

        {execution.status === "success" && (
          <div className="flex items-center gap-2 text-sm text-foreground/60">
            {execution.isPreviousResult ? (
              <>
                <History className="h-4 w-4 text-blue-500" />
                <span>Previous result</span>
                {lastExecutedAt && (
                  <span className="text-xs">
                    ({formatDate(lastExecutedAt, true)})
                  </span>
                )}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Success</span>
              </>
            )}
            {executionTime && (
              <span className="flex items-center gap-1 ml-auto">
                <Clock className="h-3 w-3" />
                {executionTime}ms
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 p-4 min-h-0 overflow-auto">
        {execution.status === "idle" && (
          <Card className="flex items-center justify-center h-full">
            <p className="text-sm text-foreground/40">
              Configure parameters and click Run to see results.
            </p>
          </Card>
        )}
        {execution.status === "running" && (
          <Card className="flex items-center justify-center h-full">
            <Loader centered size="md" label="Executing plugin..." />
          </Card>
        )}
        {execution.status === "loading" && (
          <Card className="flex items-center justify-center h-full">
            <Loader centered size="md" label="Loading previous results..." />
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
    </div>
  );
}
