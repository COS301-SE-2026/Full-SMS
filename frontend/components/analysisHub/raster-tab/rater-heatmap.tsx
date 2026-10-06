import { Card, Button} from "@/components/ui";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import { colors } from "@/lib/tokens";
import { getRasterData } from "@/services/analysisServices";
import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { Comment } from "@/types/comment";
import { useCommentClick } from '@/hooks/useCommentClick';
import { buildCommentMarkers } from '@/lib/commentMarkers';

interface RasterHeatmapProps {
  comments: Comment[];
  onAddComment: (payload: { content: string; anchor_x: number; anchor_y: number }) => void;
}
export function RasterHeatmap({comments, onAddComment}: Readonly<RasterHeatmapProps>) {
  const [rasterData, setRasterData] = useState<any>(null);
  const { currentMeasurement, currentUpload, heatMapColor, hdf5Metadata } = useHdf5Data();

  useEffect(() => {
    const fetchRasterData = async () => {
      // Prevent fetching if we don't have the context IDs yet
      if (!currentUpload || !currentMeasurement) return;

      const payload = {
        upload_id: currentUpload,
        measurement_id: currentMeasurement,
      };
      console.log("Payload: ", payload);

      try {
        const data = await getRasterData(payload);
        console.log("Fetched Raster Data:", data);
        setRasterData(data);
      } catch (error) {
        console.error("Failed to fetch raster data:", error);
      }
    };
    if(hdf5Metadata?.has_rasters){
          fetchRasterData();
    }

  }, [currentMeasurement, currentUpload]);

  const { progressSpot, setProgressSpot, noteText, setNoteText, controlPlotClick, controlSubmitNote: controlSubmitComment } = useCommentClick(onAddComment);

  if(!hdf5Metadata?.has_rasters){
    return(
      <Card className="w-[83vw] h-[85vh] mt-1 text-warning p-4 flex flex-col text-center justify-center">
        <p>This Measurement does not have raster scan data.</p>
      </Card>
    )
  }

  if (!rasterData?.raster_scan) {
    return (
      <Card className="w-[83vw] h-[85vh] mt-1 p-4 flex flex-col items-center justify-center text-foreground/60">
        <p>Loading Raster Scan...</p>
      </Card>
    );
  }

  const { raster_scan, raster_scan_coord } = rasterData;

  // Calculate physical step sizes (um per pixel)
  const numRows = raster_scan.data.length;
  const numCols = raster_scan.data[0].length;
  const dx = raster_scan.scan_range / numCols;
  const dy = raster_scan.scan_range / numRows;

  const commentMarkers = buildCommentMarkers(comments);

  return (
    <div>
    <Card className="flex flex-col w-[83vw] h-[85vh] p-2 mt-1 gap-4">
      <Plot
        data={[
          {
            z: raster_scan.data,
            type: "heatmap",
            colorscale: heatMapColor,
            x0: raster_scan.x_start,
            dx: dx,
            y0: raster_scan.y_start,
            dy: dy,
            hoverinfo: "x+y+z",
            colorbar: {
              title: { text: "Intensity" },
              thickness: 15,
            },
          },
          {
            x: [raster_scan_coord[0]],
            y: [raster_scan_coord[1]],
            type: "scatter",
            mode: "markers",
            marker: {
              symbol: "cross",
              size: 14,
              color: "rgba(50, 255, 50, 1)",
              line: {
                color: "rgba(50, 255, 50, 1)",
                width: 3,
              },
            },
            name: "Measurement Position",
            hoverinfo: "x+y",
          }, commentMarkers
        ]}
        layout={{
          title: { text: "Raster Scan" },
          xaxis: {
            title: { text: "X Position (um)" },
            zeroline: false,
          },
          yaxis: {
            title: { text: "Y Position (um)" },
            scaleanchor: "x",
            scaleratio: 1,
            zeroline: false,
          },
          plot_bgcolor: colors.card,
          paper_bgcolor: "transparent",
          font: {
            family: "JetBrains Mono, monospace",
            size: 14,
            color: colors.foreground,
          },
          margin: { t: 40, r: 20, b: 50, l: 60 },
          showlegend: false,
          autosize: true,
        }}
        onClick={controlPlotClick}
        useResizeHandler={true}
        style={{ width: "100%", height: "100%", minHeight: "500px" }}
      />
    </Card>

    {progressSpot && (
        <div className="flex gap-2 items-center p-2 border-t border-border">
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note..."
            className="border border-border bg-card rounded flex-1 text-xs px-2 py-1"
          />
          <Button onClick={controlSubmitComment} variant="primary">Add</Button>
          <Button onClick={() => setProgressSpot(null)} variant="secondary">Cancel</Button>
        </div>
      )}
    </div>
  );
}
