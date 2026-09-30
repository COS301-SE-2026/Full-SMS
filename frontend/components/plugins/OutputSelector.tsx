"use client";

import { useEffect, useState } from "react";
import { Link2 } from "lucide-react";
import { PluginOutputReference, DataOutputType } from "@/types/plugin";
import { pluginService } from "@/services/pluginServices";

interface OutputSelectorProps {
  workspaceId: string;
  measurementId: string;
  acceptedTypes?: DataOutputType[];
  acceptedPluginIds?: string[];
  value?: string;
  onChange: (
    value: string | undefined,
    reference?: PluginOutputReference,
  ) => void;
  placeholder?: string;
}

export default function OutputSelector({
  workspaceId,
  measurementId,
  acceptedTypes,
  acceptedPluginIds,
  value,
  onChange,
  placeholder = "Select output...",
}: Readonly<OutputSelectorProps>) {
  const [outputs, setOutputs] = useState<PluginOutputReference[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId || !measurementId) return;

    const fetchOutputs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await pluginService.getAvailableOutputs(
          workspaceId,
          measurementId,
          acceptedTypes,
          acceptedPluginIds,
        );
        if (response.success) {
          setOutputs(response.outputs || []);
        } else {
          setError(response.message || "Failed to load outputs");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load outputs");
      } finally {
        setLoading(false);
      }
    };

    fetchOutputs();
  }, [workspaceId, measurementId, acceptedTypes, acceptedPluginIds]);

  const groupedOutputs = outputs.reduce<
    Record<string, PluginOutputReference[]>
  >((acc, output) => {
    const key = output.plugin_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(output);
    return acc;
  }, {});

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "" || val === "none") {
      onChange(undefined);
      return;
    }
    const selected = outputs.find(
      (o) => `${o.execution_id}:${o.output_id}` === val,
    );
    onChange(val, selected);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (error) {
    return (
      <div className="text-xs text-destructive px-3 py-2 bg-destructive/10 rounded border border-destructive/20">
        {error}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 relative z-20">
      <Link2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <select
        value={value || "none"}
        onChange={handleChange}
        disabled={loading}
        className="h-7 px-2 pr-6 rounded bg-card border border-border text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer min-w-[180px]"
      >
        <option value="none">{loading ? "Loading..." : placeholder}</option>
        {Object.entries(groupedOutputs).map(([pluginName, pluginOutputs]) => (
          <optgroup key={pluginName} label={pluginName}>
            {pluginOutputs.map((output) => (
              <option
                key={`${output.execution_id}:${output.output_id}`}
                value={`${output.execution_id}:${output.output_id}`}
              >
                {output.output_label} ({output.output_type} ·{" "}
                {formatTime(output.executed_at)})
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
