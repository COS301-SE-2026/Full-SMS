"use client";

import dynamic from "next/dynamic";
import { PlotData } from "@/types/plugin";
import { colors } from "@/lib/tokens";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface PlotRendererProps {
  data: PlotData;
  label: string;
}

export default function PlotRenderer({ data, label }: PlotRendererProps) {
  const { x, y, xlabel, ylabel, title, type = "line", series } = data;

  const allSeries = series || [{ x, y, label: "Data" }];

  if (!allSeries.length || !allSeries[0].x?.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 text-foreground/50 text-center">
        No plot data
      </div>
    );
  }

  const getMode = () => {
    switch (type) {
      case "scatter":
        return "markers";
      case "line":
        return "lines";
      default:
        return "lines";
    }
  };

  const plotData = allSeries.map((s, i) => ({
    x: s.x,
    y: s.y,
    type: "scatter" as const,
    mode: getMode(),
    name: s.label,
    line: {
      color: colors.chart[i % colors.chart.length],
      width: 1.5,
    },
    marker: {
      color: colors.chart[i % colors.chart.length],
      size: 6,
    },
  }));

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="w-full h-64">
        <Plot
          data={plotData}
          layout={{
            title:
              title || label
                ? { text: title || label, font: { color: colors.foreground } }
                : undefined,
            xaxis: {
              title: xlabel || "",
              color: colors.foreground,
              gridcolor: colors.border,
              showgrid: true,
            },
            yaxis: {
              title: ylabel || "",
              color: colors.foreground,
              gridcolor: colors.border,
              showgrid: true,
            },
            plot_bgcolor: colors.card,
            paper_bgcolor: colors.card,
            autosize: true,
            margin: { l: 50, r: 20, t: title ? 40 : 20, b: 50 },
            showlegend: allSeries.length > 1,
            legend: {
              font: { color: colors.foreground },
            },
          }}
          useResizeHandler={true}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}
