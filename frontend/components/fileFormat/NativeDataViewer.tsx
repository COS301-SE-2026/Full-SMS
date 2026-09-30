"use client";

import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import {
  getNativeDataBlocks,
  getNativeDataView,
} from "@/services/hdf5services";
import { Card } from "../ui/Card";

interface NativeBlock {
  id: number;
  name: string;
  kind: string;
  shape: number[];
}

interface NativeBlocksResponse {
  blocks: NativeBlock[];
}

interface HistogramView {
  kind: "histogram";
  title: string;
  xlabel: string;
  ylabel: string;
  bins: number[];
  counts: number[];
}

interface CurvesView {
  kind: "curves";
  title: string;
  xlabel: string;
  ylabel: string;
  series: Array<{ label: string; x: number[]; y: number[] }>;
}

interface HeatmapView {
  kind: "heatmap";
  title: string;
  xlabel: string;
  ylabel: string;
  time: number;
  values: number[][];
}

type NativeView = HistogramView | CurvesView | HeatmapView;

interface NativeDataViewerProps {
  readonly uploadId: string;
}

export default function NativeDataViewer({
  uploadId,
}: Readonly<NativeDataViewerProps>) {
  const [blocks, setBlocks] = useState<NativeBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<number>();
  const [sliceIndex, setSliceIndex] = useState(0);
  const [viewData, setViewData] = useState<NativeView>();

  useEffect(() => {
    let active = true;
    getNativeDataBlocks(uploadId)
      .then((response: NativeBlocksResponse) => {
        if (!active) return;
        setBlocks(response.blocks || []);
        setSelectedBlockId(response.blocks?.[0]?.id);
      })
      .catch(() => {
        if (active) setBlocks([]);
      });

    return () => {
      active = false;
    };
  }, [uploadId]);

  const selectedBlock = blocks.find((block) => block.id === selectedBlockId);
  let view = "flim_slice";
  if (selectedBlock?.kind === "decay_histogram") view = "histogram";
  if (selectedBlock?.kind === "curve_matrix") view = "curves";

  useEffect(() => {
    if (selectedBlockId === undefined) return;

    let active = true;
    getNativeDataView(uploadId, selectedBlockId, view, sliceIndex)
      .then((response: NativeView) => {
        if (active) setViewData(response);
      })
      .catch(() => {
        if (active) setViewData(undefined);
      });

    return () => {
      active = false;
    };
  }, [uploadId, selectedBlockId, view, sliceIndex]);

  if (!blocks.length) return null;

  const layout = {
    autosize: true,
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { color: "var(--foreground)" },
    margin: { l: 55, r: 20, t: 40, b: 55 },
    xaxis: { title: viewData?.xlabel || "", automargin: true },
    yaxis: { title: viewData?.ylabel || "", automargin: true },
    showlegend: viewData?.kind === "curves",
  };

  return (
    <Card className="w-full h-[84vh] mx-auto border border-border bg-card p-4 space-y-3">
      <div className="flex-1 min-h-0 h-full overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            Native B&amp;H data
          </h2>
         <div className="flex items-center gap-2">
          <label className="text-xs text-foreground/70 whitespace-nowrap">
              <span>Block</span>
              <select
                value={selectedBlockId ?? ""}
                onChange={(event) => {
                  setSelectedBlockId(Number(event.target.value));
                  setSliceIndex(0);
                }}
                className="h-8 rounded border border-border bg-background px-2 text-foreground"
              >
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.name} ({block.shape.join(" x ")})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {selectedBlock?.kind === "flim" && (
          <label className="flex items-center gap-3 text-xs text-muted-foreground">
            Time slice {sliceIndex + 1} / {selectedBlock.shape.at(-1)}
            <input
              type="range"
              min={0}
              max={Math.max(0, (selectedBlock.shape.at(-1) || 1) - 1)}
              value={sliceIndex}
              onChange={(event) => setSliceIndex(Number(event.target.value))}
              className="w-48"
            />
          </label>
        )}

        <div className="h-full w-full">
          {viewData?.kind === "histogram" && (
            <Plot
              data={[{ x: viewData.bins, y: viewData.counts, type: "bar" }]}
              layout={{ ...layout, title: { text: viewData.title } }}
              useResizeHandler
              style={{ width: "100%", height: "100%" }}
            />
          )}
          {viewData?.kind === "curves" && (
            <Plot
              data={viewData.series.map((series) => ({
                x: series.x,
                y: series.y,
                name: series.label,
                type: "scatter" as const,
                mode: "lines" as const,
              }))}
              layout={{ ...layout, title: { text: viewData.title } }}
              useResizeHandler
              style={{ width: "100%", height: "100%" }}
            />
          )}
          {viewData?.kind === "heatmap" && (
            <Plot
              data={[
                { z: viewData.values, type: "heatmap", colorscale: "Viridis" },
              ]}
              layout={{ ...layout, title: { text: viewData.title } }}
              useResizeHandler
              style={{ width: "100%", height: "100%" }}
            />
          )}
        </div>
      </div>
    </Card>
  );
}
