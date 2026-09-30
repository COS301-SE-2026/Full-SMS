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
import { History, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui";
import { useComments } from "@/hooks/useComments";
import { CommentPanel } from "../comments/CommentPanel";
import { commentService } from "@/services/commentServices";
import { workspaceService } from "@/services/workspaceServices";
import { WorkspaceMemberProfile } from "@/types/workspace";
import { useToast } from "@/contexts/toastContext/ToastContext";

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
  const [MemberLookup, setMemberLookup] = useState<Record<string, WorkspaceMemberProfile>>({})
  const [progressSpot, setProgressSpot] = useState<{ x: number; y: number } | null>(null)
  const [noteText, setNoteText] = useState('')

  const {comments, loading: commentsLoading, error: commentsError, fetchComments} =
    useComments(currentWorkspaceId, currentUpload, "spectra")
  const { successToast, errorToast} = useToast()

  const controlPlotClick = (event:any) => {
    const point = event.points?.[0]
    if(!point) return
    setProgressSpot({x: point.x, y: point.y})
  }

  const controlSubmitComment = async () => {
    if(!progressSpot || !noteText.trim()) return
    if (!currentWorkspaceId || !currentUpload) return
    try{
      await commentService.addComment(currentWorkspaceId, {
        content: noteText,
        anchor_x: progressSpot.x,
        anchor_y: progressSpot.y,
        upload_id: currentUpload,
        tab: "spectra",
      })
      fetchComments()
      successToast("Comment has been added successfully")
    } catch(error: any){
      errorToast(error.message || "Failed to add comment")
    }
    setProgressSpot(null)
    setNoteText('')
  }

  useEffect(() => {
    if(!currentWorkspaceId) return
    let stopped = false
    workspaceService.getWorkspaceMembers(currentWorkspaceId)
      .then((res) => {
        if(stopped) return
        const lookup: Record<string, WorkspaceMemberProfile> = {}
        for (const member of res.members){
          lookup[member.id] = member
        }
        setMemberLookup(lookup)
      })
      .catch(() => {
        if(!stopped) setMemberLookup({})
      })

      return () => {stopped = true}
  }, [currentWorkspaceId])

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

  const commentMarkers = {
    x: comments.map((t) => t.anchor_x ?? 0),
    y: comments.map((t) => t.anchor_y ?? 0),
    type: 'scatter',
    mode: 'markers',
    name: 'Comments',
    marker: {color: colors.warning, size: 10, symbol: 'star'},
    text: comments.map((t) => t.content),
    hoverinfo: 'text',
  }

  return (
    <div className="flex gap-3">
      <div className="flex flex-col flex-1">
      <div className="flex items-center gap-4 h-12 px-4 border-b border-border bg-background flex-wrap z-10">
        <h3 className="text-foreground">Spectra</h3>
        <div className="flex items-center gap-4 h-12 px-4 border-b border-border bg-background flex-wrap z-10 flex-1">
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
          <Button variant="ghost" size="sm" 
            title="View Parameter history"
            onClick={() => setHistoryOpen((v) => !v)}
            className={`ml-auto ${historyOpen ? "bg-card" : ""}`}
            leftIcon={<History size={14} />}
          />

          <Button 
          variant="ghost" size="sm"
          title="View Comments"
          onClick={() => setCommentsOpen((v) => !v)}
          className={`py-0.5 px-2 min-h-0 ${commentsOpen ? "bg-card":""}`}
          leftIcon={<MessageSquare size={14}/>}
          />
        </div>
      </div>

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
    authorFinder={MemberLookup}
  />
)}
    </div>
  );
}
