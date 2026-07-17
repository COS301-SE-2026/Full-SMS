"use client";

import {
  ResultsRendererProps,
  PluginOutput,
  PlotData,
  HistogramData,
  TableData,
  ValueData,
  HeatmapData,
} from "@/types/plugin";
import PlotRenderer from "./PlotRenderer";
import HistogramRenderer from "./HistogramRenderer";
import TableRenderer from "./TableRenderer";
import ValueRenderer from "./ValueRenderer";
import HeatmapRenderer from "./HeatmapRenderer";

export default function ResultsRenderer({
  outputs,
  results,
}: ResultsRendererProps) {
  const renderOutput = (output: PluginOutput) => {
    const data = results[output.id];

    if (data === undefined || data === null) {
      return (
        <div
          key={output.id}
          className="bg-card border border-border rounded-lg p-4 text-foreground/40"
        >
          <p className="text-sm">{output.label}</p>
          <p className="text-xs">No data returned</p>
        </div>
      );
    }

    switch (output.type) {
      case "plot":
        return (
          <PlotRenderer
            key={output.id}
            data={data as PlotData}
            label={output.label}
          />
        );

      case "histogram":
        return (
          <HistogramRenderer
            key={output.id}
            data={data as HistogramData}
            label={output.label}
          />
        );

      case "table":
        return (
          <TableRenderer
            key={output.id}
            data={data as TableData}
            label={output.label}
          />
        );

      case "value":
        return (
          <ValueRenderer
            key={output.id}
            data={data as ValueData}
            label={output.label}
          />
        );

      case "heatmap":
        return <HeatmapRenderer key={output.id} data={data as HeatmapData} />;

      default:
        return (
          <div
            key={output.id}
            className="bg-card border border-border rounded-lg p-4"
          >
            <p className="text-sm text-foreground/60">{output.label}</p>
            <pre className="text-xs text-foreground overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        );
    }
  };

  if (outputs.length === 0) {
    return (
      <p className="text-sm text-foreground/60 py-4 text-center">
        This plugin has no defined outputs.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">{outputs.map(renderOutput)}</div>
  );
}
