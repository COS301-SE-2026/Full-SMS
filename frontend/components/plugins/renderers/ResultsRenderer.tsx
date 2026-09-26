"use client";

import {
  PluginOutput,
  PlotData,
  HistogramData,
  TableData,
  ValueData,
  HeatmapData,
  ArrayData,
  DatasetData,
  TimeseriesData,
  FitResultData,
  DataframeData,
  isDataOutputType,
} from "@/types/plugin";
import PlotRenderer from "./PlotRenderer";
import HistogramRenderer from "./HistogramRenderer";
import TableRenderer from "./TableRenderer";
import ValueRenderer from "./ValueRenderer";
import HeatmapRenderer from "./HeatmapRenderer";
import ArrayRenderer from "./ArrayRenderer";
import DatasetRenderer from "./DatasetRenderer";
import TimeseriesRenderer from "./TimeseriesRenderer";
import FitResultRenderer from "./FitResultRenderer";
import DataframeRenderer from "./DataFrameRenderer";

interface ResultsRendererProps {
  outputs: PluginOutput[];
  results: Record<string, unknown>;
}

export default function ResultsRenderer({
  outputs,
  results,
}: Readonly<ResultsRendererProps>) {
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

    const isChainable =
      isDataOutputType(output.type) && output.chainable !== false;

    const renderContent = () => {
      switch (output.type) {
        case "plot":
          return <PlotRenderer data={data as PlotData} label={output.label} />;
        case "histogram":
          return (
            <HistogramRenderer
              data={data as HistogramData}
              label={output.label}
            />
          );
        case "table":
          return <TableRenderer data={data as TableData} label={output.label} />;
        case "value":
          return <ValueRenderer data={data as ValueData} label={output.label} />;
        case "heatmap":
          return <HeatmapRenderer data={data as HeatmapData} />;
        case "array":
          return <ArrayRenderer data={data as ArrayData} label={output.label} />;
        case "dataset":
          return (
            <DatasetRenderer data={data as DatasetData} label={output.label} />
          );
        case "timeseries":
          return (
            <TimeseriesRenderer
              data={data as TimeseriesData}
              label={output.label}
            />
          );
        case "fitresult":
          return (
            <FitResultRenderer
              data={data as FitResultData}
              label={output.label}
            />
          );
        case "dataframe":
          return (
            <DataframeRenderer
              data={data as DataframeData}
              label={output.label}
            />
          );
        default:
          return (
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-foreground/60">{output.label}</p>
              <pre className="text-xs text-foreground overflow-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          );
      }
    };

    return (
      <div key={output.id} className="relative group">
        {renderContent()}
        {isChainable && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">
              Chainable
            </span>
          </div>
        )}
      </div>
    );
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
