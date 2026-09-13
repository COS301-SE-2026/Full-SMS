import { Card } from "@/components/ui/Card";
import { colors } from "@/lib/tokens";
import React, { useEffect, useMemo, useState } from "react";
import Plot from "react-plotly.js";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";

function CorrelationChart() {
  const { correlationData, currentMeasurement } = useHdf5Data();

  const { xAxis, yAxis } = useMemo(() => {
    if (correlationData?.measurement_id === currentMeasurement) {
      return {
        xAxis: correlationData.tau,
        yAxis: correlationData.g2,
      };
    }
    return { xAxis: [], yAxis: [] };
  }, [correlationData, currentMeasurement]);

  return (
        <Card className="flex flex-col w-[83vw] h-[85vh] p-2 mt-1 gap-4 font-mono">
      <div className="flex-1 min-h-0 h-full overflow-hidden">
        <Plot
          className="font-mono w-full"
          data={[
            {
              x: xAxis,
              y: yAxis,
              type: "scatter",
              mode: "lines",
              name: "g2(τ)",
              line: {
                color: colors.primary,
                width: 1.2,
              },
            },
          ]}
          layout={{
            title: { text: "g² Correlation" },
            xaxis: {
              title: {text: "Delay (ns)"},
              autorange: true,
              zeroline: false,
            },
            yaxis: {
              title: {text: "Counts"},
              autorange: true,
            },
            shapes: [
              // Vertical reference line at tau = 0
              {
                type: "line",
                x0: 0,
                x1: 0,
                y0: 0,
                y1: 1,
                yref: "paper",
                line: {
                  color: "rgba(128, 128, 128, 0.5)",
                  width: 1,
                  dash: "dash",
                },
              },
            ],
            plot_bgcolor: colors.card,
            paper_bgcolor: colors.card,
            margin: { t: 40, r: 20, b: 50, l: 60 },
            font: {
              family: "JetBrains Mono, monospace",
              size: 14,
              color: colors.foreground,
            },
          }}
          style={{ width: "100%", height: "100%" }}
          useResizeHandler
        />
      </div>
    </Card>
  );
}

export default CorrelationChart;
