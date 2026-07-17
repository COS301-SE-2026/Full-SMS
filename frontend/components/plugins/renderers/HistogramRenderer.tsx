"use client";

import dynamic from "next/dynamic";
import { HistogramData } from "@/types/plugin";
import { colors } from "@/lib/tokens";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface HistogramRendererProps {
  data: HistogramData;
  label: string;
}

export default function HistogramRenderer({
  data,
  label,
}: HistogramRendererProps) {
  const { bins, counts, xlabel, ylabel, title } = data;

  if (!bins || bins.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 text-foreground/50 text-center">
        No histogram data
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="w-full h-64">
        <Plot
          data={[
            {
              x: bins,
              y: counts,
              type: "bar",
              marker: { color: colors.primary },
            },
          ]}
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
            showlegend: false,
          }}
          useResizeHandler={true}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}
