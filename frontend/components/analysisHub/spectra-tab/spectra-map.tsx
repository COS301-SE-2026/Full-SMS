import { Card } from "@/components/ui";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import { useHistory } from "@/hooks/useHistory";
import { useHistoryRecorder } from "@/hooks/useHistoryRecorder";
import { colors } from "@/lib/tokens";
import { getSpectraData } from "@/services/analysisServices";
import { SpectraData } from "@/types/analysis";
import React, { useEffect, useMemo, useState } from "react";
import Plot from "react-plotly.js";
import { HistoryPanel } from "../history/HistoryPanel";
import { historyService } from "@/services/historyServices";
import { Button } from "@/components/ui";
import { CommentToolbarButtons, NewCommentInput } from "../comments/CommentToolbar";
import { useComments } from "@/hooks/useComments";
import { CommentPanel } from "../comments/CommentPanel";
import { useMemberLookup } from "@/hooks/useMemberLookup";
import { useCommentClick } from "@/hooks/useCommentClick";
import { buildCommentMarkers } from "@/lib/commentMarkers";
import { useCommentSubmit } from "@/hooks/useCommentSubmit";

export default function SpectraMap() {
  const {
    currentUpload,
    currentMeasurement,
    spectraHeatMapColor,
    setSpectraHeatMapColor,
    currentWorkspaceId,
    hdf5Metadata,
    members,
  } = useHdf5Data();
  const { entries, loading, error, fetchHistory}= useHistory(currentWorkspaceId, currentUpload, "spectra");
  const recordHistory = useHistoryRecorder(currentWorkspaceId, currentUpload, "spectra", fetchHistory);

  const [spectraData, setSpectraData] = useState<SpectraData>();
  const [historyOpen, setHistoryOpen] = useState(false);

  const [commentsOpen, setCommentsOpen] = useState(false)
  const [newCommentOpen, setNewCommentOpen] = useState(false)
  const memberLookup = useMemberLookup(currentWorkspaceId)

  const {comments, loading: commentsLoading, error: commentsError, fetchComments} =
    useComments(currentWorkspaceId, currentUpload, "spectra", currentMeasurement)
  const controlAddComment = useCommentSubmit(currentWorkspaceId, currentUpload, "spectra", fetchComments, currentMeasurement)

  const { progressSpot, setProgressSpot, noteText, setNoteText, controlPlotClick, controlSubmitNote: controlSubmitComment } = useCommentClick(controlAddComment);

  const colourmaps = [
    "Plasma",
    "Viridis",
    "Inferno",
    "Hot",
    "Cool",
    "Twilight",
  ];

  useEffect(() => {
    const fetchSpectraData = async () => {
      try {
        const payload = {
          upload_id: currentUpload,
          measurement_id: currentMeasurement,
        };
        const response = await getSpectraData(payload);
        setSpectraData(response);
      } catch (error) {
        console.error("Unable to fetch spectra data: ", error);
      }
    };
    if(hdf5Metadata?.has_spectra){
      fetchSpectraData();
    }

  }, [currentMeasurement, currentUpload]);

  const plotData = useMemo(() => {
    if (!spectraData?.z) {
      return null;
    }
    const {
      z: matrix,
      rows,
      cols,
      bounds_min,
      bounds_max,
      scale_min,
      scale_max,
      exposure_time,
    } = spectraData;
    const [t_min, wl_min] = bounds_min;
    const [t_max, wl_max] = bounds_max;
    const z = matrix.slice().reverse();
    const dt = (t_max - t_min) / (cols - 1 || 1);
    const dwl = (wl_max - wl_min) / (rows - 1 || 1);

    return { z, t_min, wl_min, dt, dwl, scale_min, scale_max, exposure_time };
  }, [spectraData]);

  if(!hdf5Metadata?.has_spectra){
    return(
      <Card className="w-[83vw] h-[85vh] mt-1 text-warning p-4 flex flex-col text-center justify-center">
        <p>This Measurement does not have spectra scan data.</p>
      </Card>
    )
  }

  const commentMarkers = buildCommentMarkers(comments);

  return (
    <div className="flex gap-3">
      <div className="flex flex-col flex-1">
      <div className="flex items-center gap-4 h-12 px-4 -mx-3 -mt-3 border-b border-border bg-background flex-wrap z-10">
        <h3 className="text-foreground">Spectra</h3>
        <div className="flex items-center gap-4 flex-wrap flex-1">
          <div className="flex items-center gap-2">
            <label
              className="text-xs text-foreground/70 whitespace-nowrap"
              htmlFor="heat-map"
            >
              Colormap
            </label>
            <select
              name="heat-map"
              value={spectraHeatMapColor}
              onChange={(e) => {
                setSpectraHeatMapColor(e.target.value);
                recordHistory("colormap", spectraHeatMapColor, e.target.value);
              }}
              className="w-20 h-7 px-2 rounded bg-card border border-border text-xs text-foreground text-right font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary appearance-none cursor-pointer"
            >
              {colourmaps.map((map) => (
                <option key={map} value={map}>
                  {map}
                </option>
              ))}
            </select>
          </div>
          <CommentToolbarButtons
            className="ml-auto"
            historyOpen={historyOpen}
            onToggleHistory={() => setHistoryOpen((v) => !v)}
            commentsOpen={commentsOpen}
            onToggleComments={() => setCommentsOpen((v) => !v)}
            onNewComment={() => setNewCommentOpen((v) => !v)}
            commentCount={comments.length}
          />
        </div>
      </div>

      <NewCommentInput
        open={newCommentOpen}
        onSubmit={controlAddComment}
        onClose={() => setNewCommentOpen(false)}
      />

      <Card className="flex flex-col w-[83vw] h-[85vh] p-2 mt-1 gap-4">
        <Plot
          data={[
            {
              type: "heatmap",
              z: plotData?.z,
              x0: plotData?.t_min,
              dx: plotData?.dt,
              y0: plotData?.wl_min,
              dy: plotData?.dwl,
              zmin: plotData?.scale_min,
              zmax: plotData?.scale_max,
              colorscale: spectraHeatMapColor,
              colorbar: {
                title: { text: "Intensity" },
                tickfont: { color: colors.foreground },
                titlefont: { color: colors.foreground },
              },
            }, commentMarkers
          ]}
          layout={{
            title: {
              text: "Spectral Trace",
              font: { color: colors.foreground },
            },
            xaxis: {
              title: { text: "Time (s)" },
              color: colors.foreground,
              gridcolor: colors.border,
            },
            yaxis: {
              title: { text: "Wavelength (nm)" },
              color: colors.foreground,
              gridcolor: colors.border,
            },
            paper_bgcolor: colors.card,
            plot_bgcolor: colors.background,
            font: {
              family: "JetBrains Mono, monospace",
              size: 14,
              color: colors.foreground,
            },
            autosize: true,
            margin: { l: 60, r: 20, t: 40, b: 50 },
          }}
          useResizeHandler={true}
          onClick={controlPlotClick}
          style={{ width: "100%", height: "100%", minHeight: "400px" }}
        />
      </Card>

      {progressSpot && (
  <div className="flex gap-2 items-center p-2 border-t border-border">
    <input
      value={noteText}
      onChange={(e) => setNoteText(e.target.value)}
      placeholder="Add a vomment.."
      className="border border-border bg-card rounded flex-1 text-xs px-2 py-1"
    />
    <Button onClick={controlSubmitComment} variant="primary">Add</Button>
    <Button onClick={() => setProgressSpot(null)} variant="secondary">Cancel</Button>
  </div>
)}
    </div>
    {historyOpen && (<HistoryPanel
      entries={entries}
      loading={loading}
      error={error}
      members={members}
      onRevert={(entry) =>{
        setSpectraHeatMapColor(entry.old_value);
        historyService.revertEntry(currentWorkspaceId!, entry.id).then(fetchHistory);
      }}
    />
    )}

    {commentsOpen && (
  <CommentPanel
    comments={comments}
    loading={commentsLoading}
    error={commentsError}
    authorFinder={memberLookup}
  />
)}
    </div>
  );
}
