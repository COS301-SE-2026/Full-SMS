"use client";

import dynamic from "next/dynamic";
import { HeatmapData } from "@/types/plugin";
import { colors } from "@/lib/tokens";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface HeatmapRendererProps {
  data: HeatmapData;
}

const colorScaleMap: Record<string, string> = {
  plasma: "Plasma",
  viridis: "Viridis",
  inferno: "Inferno",
  magma: "Magma",
  grayscale: "Greys",
};

export default function HeatmapRenderer({ data }: HeatmapRendererProps) {
  if (!data || data.values.length === 0) {
    return (
      <div className="text-center text-sm text-foreground/60">
        No heatmap data available
      </div>
    );
  }

  const colorScale = colorScaleMap[data.colorScale || "plasma"] || "Plasma";

  return (
    <div className="w-full h-full min-h-[300px]">
      <Plot
        data={[
          {
            z: data.values,
            type: "heatmap",
            colorscale: colorScale,
            colorbar: {
              title: "Intensity",
              tickfont: { color: colors.foreground },
              titlefont: { color: colors.foreground },
            },
          },
        ]}
        layout={{
          title: data.title
            ? { text: data.title, font: { color: colors.foreground } }
            : undefined,
          xaxis: {
            title: data.xlabel || "",
            color: colors.foreground,
            gridcolor: colors.border,
          },
          yaxis: {
            title: data.ylabel || "",
            color: colors.foreground,
            gridcolor: colors.border,
          },
          paper_bgcolor: colors.background,
          plot_bgcolor: colors.background,
          autosize: true,
          margin: { l: 60, r: 20, t: data.title ? 40 : 20, b: 50 },
        }}
        useResizeHandler={true}
        style={{ width: "100%", height: "100%", minHeight: "300px" }}
      />
    </div>
  );
}
