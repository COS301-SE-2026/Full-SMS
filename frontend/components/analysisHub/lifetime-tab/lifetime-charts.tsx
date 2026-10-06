import { Card, Button } from '@/components/ui'
import { useAnalysisTab } from '@/contexts/analysisTabsContext/AnalysisTabsContext'
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext'
import { colors } from '@/lib/tokens'
import { getFluorescenceDecay } from '@/services/analysisServices'
import React, { useEffect } from 'react'
import Plot from 'react-plotly.js'
import { Comment } from '@/types/comment'
import NativeDataViewer from "@/components/fileFormat/NativeDataViewer";
import { useCommentClick } from '@/hooks/useCommentClick';
import { buildCommentMarkers } from '@/lib/commentMarkers';


interface LifeTimeChartProps{
  comments: Comment[];
  onAddComment: (payload: {content: string; anchor_x: number; anchor_y: number}) => void;
}

export default function LifetimeCharts({comments, onAddComment}: Readonly<LifeTimeChartProps>) {
    const { currentMeasurement, currentUpload, bin, currentChannel, hdf5Metadata} = useHdf5Data()
    const {useLogScale, decayCounts, setDecayCounts, decayTimes, setDecayTimes, fitResult} = useAnalysisTab()
    const { progressSpot, setProgressSpot, noteText, setNoteText, controlPlotClick, controlSubmitNote } = useCommentClick(onAddComment);
    const commentMarkers = buildCommentMarkers(comments, 'x', 'y');
      const useNativeBlocksViewer = hdf5Metadata?.data_kind ==="native_data"
      console.log("NATIVE",useNativeBlocksViewer);
  

  useEffect(() => {
    const fetchLifetimeData = async () => {
      if (!currentUpload || !currentMeasurement) return;

      const payload = {
        upload_id: currentUpload,
        measurement_id: currentMeasurement,
        bin_size_ms: bin,
        channel: currentChannel,
      };
      try {
        const response = await getFluorescenceDecay(payload);
        setDecayTimes(response.times);
        setDecayCounts(response.counts);
      } catch (error) {
        console.error(error);
      }
    };

    fetchLifetimeData();
  }, [currentMeasurement, currentUpload, currentChannel]);

  // if (useNativeBlocksViewer) {
  //   return(
  //     <NativeDataViewer uploadId={currentUpload}/>
  //   )
  // } else {
    return (
      <div>
        <Card className="flex-1 flex flex-col p-2 min-w-0">
          <div className="flex-1 min-h-0 h-full overflow-hidden">
            <Plot
              data={[
                //Histogram Data
                {
                  x: decayTimes,
                  y: decayCounts,
                  type: "scatter",
                  mode: "line",
                  name: "Data",
                  xaxis: "x",
                  yaxis: "y",
                  line: {
                    color: colors.primary,
                    width: 0.5,
                  },
                },
                // The Fitting
                {
                  //  If the backend only returns the fitted curve for the sliced index range,
                  //slice xAxis here to match fitCurve.length
                  x: decayTimes,
                  y: fitResult?.fitted_curve, // fit curve
                  type: "scatter",
                  mode: "lines",
                  name: "Fit",
                  xaxis: "x",
                  yaxis: "y",
                  line: {
                    color: colors.destructive,
                    width: 2,
                  },
                },
                //The Residuals (Bottom Panel)
                {
                  x: decayTimes,
                  y: fitResult?.residuals, //residuals
                  type: "scatter",
                  mode: "markers",
                  name: "Residuals",
                  xaxis: "x",
                  yaxis: "y2",
                  marker: {
                    color: colors.foreground,
                    size: 4,
                  },
                }, commentMarkers
              ]}
              layout={{
                autosize: true,
                uirevision: "true",
                title: {
                  text: "Fluorescence Decay",
                  font: {
                    size: 16,
                  },
                },
                plot_bgcolor: colors.card,
                paper_bgcolor: colors.card,
                showlegend: true,

                // shared Xaxis
                xaxis: {
                  showgrid: true,
                  gridcolor: colors.border,
                  gridwidth: 1,
                  automargin: true,
                  title: {
                    text: "Time (ns)",
                    standoff: 15,
                    font: {
                      size: 12,
                    },
                  },
                },

                // Main Yaxis
                yaxis: {
                  showgrid: true,
                  gridcolor: colors.border,
                  gridwidth: 1,
                  domain: [0.3, 1.0],
                  type: useLogScale ? "log" : "linear",
                  automargin: true,
                  title: {
                    text: "Counts",
                    standoff: 15,
                    font: {
                      size: 12,
                    },
                  },
                },

                // second Yaxis
                yaxis2: {
                  showgrid: true,
                  gridcolor: colors.border,
                  gridwidth: 1,
                  domain: [0.0, 0.2],
                  automargin: true,
                  title: {
                    text: "Residuals",
                    standoff: 15,
                    font: {
                      size: 12,
                    },
                  },
                  zeroline: true,
                  zerolinecolor: colors.foreground,
                  zerolinewidth: 1,
                },

                font: {
                  family: "JetBrains Mono, monospace",
                  size: 14,
                  color: colors.foreground,
                },
                margin: { l: 80, r: 20, t: 50, b: 80 },
              }}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler
            onClick={controlPlotClick}
          />
        </div>
      </Card>

      {progressSpot && (
        <div className="flex gap-2 items-center p-2 border-t border-border">
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a comment.."
            className="border border-border bg-card rounded flex-1 text-xs px-2 py-1" />

            <Button onClick={controlSubmitNote} variant="primary">
              Add
            </Button>

            <Button onClick={() => setProgressSpot(null)} variant="secondary">
              Cancel
            </Button>

        </div>
      )}
    </div>
  )
  }
// }
