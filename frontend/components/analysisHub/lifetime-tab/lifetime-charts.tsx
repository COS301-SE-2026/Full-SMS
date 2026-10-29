import { Card, Button, ChartLoadingOverlay } from '@/components/ui'
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

const IRF_MIN_DISPLAY = 0.5 // matches the log-scale floor used for the data

function maxOf(values: readonly (number | null)[]): number {
  let max = 0
  for (const value of values) {
    if (value !== null && value > max) max = value
  }
  return max
}

// Legacy IRF display: shift, scale to targetMax, keep only the significant part
// (>= IRF_MIN_DISPLAY, plus one point either side) and clip to the display floor.
function buildIrfOverlay(irf: number[], times: number[], shift: number, targetMax: number) {
  const n = Math.min(irf.length, times.length)
  const irfMax = maxOf(irf.slice(0, n))
  if (n === 0 || irfMax <= 0) return null
  const scale = targetMax > 0 ? targetMax / irfMax : 1
  const y = irf.slice(0, n).map(c => c * scale)

  const first = y.findIndex(c => c >= IRF_MIN_DISPLAY)
  if (first === -1) return null
  let last = n - 1
  while (y[last] < IRF_MIN_DISPLAY) last -= 1
  const start = Math.max(0, first - 1)
  const end = Math.min(n, last + 2)

  return {
    x: times.slice(start, end).map(t => t + shift),
    y: y.slice(start, end).map(c => Math.max(c, IRF_MIN_DISPLAY)),
  }
}

interface LifeTimeChartProps{
  comments: Comment[];
  onAddComment: (payload: {content: string; anchor_x: number; anchor_y: number}) => void;
}

export default function LifetimeCharts({comments, onAddComment}: Readonly<LifeTimeChartProps>) {
    const { currentMeasurement, currentUpload, currentWorkspaceId, bin, currentChannel, hdf5Metadata } = useHdf5Data()
    const {
      useLogScale,
      decayCounts,
      setDecayCounts,
      decayTimes,
      setDecayTimes,
      fitResult,
      showIRF,
      irfCounts,
      setIrfCounts,
      irfTimes,
      setIrfTimes,
      fitViewRevision,
      decayLoading,
    } = useAnalysisTab()
    
    const { progressSpot, setProgressSpot, noteText, setNoteText, controlPlotClick, controlSubmitNote } = useCommentClick(onAddComment);
    const commentMarkers = buildCommentMarkers(comments, 'x', 'y');
    const useNativeBlocksViewer = hdf5Metadata?.data_kind ==="native_data"

    // Loading until the decay for the current measurement/channel arrives (or fails); level
    // and group switches report through decayLoading from useLifetimeSelection.
    const requestKey = `${currentUpload}:${currentMeasurement}:${currentChannel}:${currentWorkspaceId}`
    const [loadedKey, setLoadedKey] = React.useState<string | null>(null)
    const measurementLoading = Boolean(currentUpload && currentMeasurement) && loadedKey !== requestKey

    useEffect(() => {
      if (!currentUpload || !currentMeasurement) return;
      // Ignore a response that arrives after the measurement/channel has changed again
      let cancelled = false;
      const payload = {
        "upload_id": currentUpload,
        "workspace_id": currentWorkspaceId,
        "measurement_id": currentMeasurement,
        "bin_size_ms": bin,
        "channel": currentChannel
      };
      void getFluorescenceDecay(payload)
        .then((response) => {
          if (cancelled) return;
          setDecayTimes(response.times)
          setDecayCounts(response.counts)
          if (response.irf) {
            setIrfTimes(response.irf.t || response.times)
            setIrfCounts(response.irf.counts || [])
          } else {
            setIrfTimes([])
            setIrfCounts([])
          }
        })
        .catch((error) => console.error(error))
        .finally(() => {
          if (!cancelled) setLoadedKey(requestKey);
        });
      return () => {
        cancelled = true;
      };
    }, [currentMeasurement, currentUpload, currentChannel, currentWorkspaceId])

    // A fit carries the IRF it used: draw that one shifted by the fitted shift and scaled to
    // the fit peak. Before a fit, show the mapped IRF scaled to the data peak.
    const irfOverlay = React.useMemo(() => {
      if (fitResult?.irf?.length && fitResult.times?.length) {
        return buildIrfOverlay(fitResult.irf, fitResult.times, fitResult.shift, maxOf(fitResult.fitted_curve));
      }
      if (irfCounts.length > 0 && decayCounts.length > 0) {
        const times = irfTimes.length === irfCounts.length ? irfTimes : decayTimes;
        return buildIrfOverlay(irfCounts, times, 0, maxOf(decayCounts));
      }
      return null;
    }, [fitResult, irfCounts, irfTimes, decayCounts, decayTimes]);

    const residualSeries = React.useMemo(() => {
      const residuals = fitResult?.residuals ?? [];
      const inRange = residuals.map((r, i) =>
        i >= fitResult!.fit_start_index && i < fitResult!.fit_end_index ? r : null);
      const outOfRange = residuals.map((r, i) =>
        i < fitResult!.fit_start_index || i >= fitResult!.fit_end_index ? r : null);
      return { inRange, outOfRange };
    }, [fitResult]);

  return (
    <div>
      <Card className="flex-1 flex flex-col p-2 min-w-0">
        <div className="relative flex-1 min-h-0 h-full overflow-hidden">
          <ChartLoadingOverlay loading={measurementLoading || decayLoading} />
          <Plot
            data={[
              //Histogram Data
              {
                x: decayTimes, 
                y: useLogScale ? decayCounts.map(c => Math.max(c, 0.5)) : decayCounts, 
                type: 'scatter', 
                mode: 'line', 
                name: 'Data',
                xaxis: 'x', 
                yaxis: 'y', 
                line: {
                  color: colors.primary, 
                  width: 0.5,
                }
              },
              ...(showIRF && irfOverlay ? [{
                x: irfOverlay.x,
                y: irfOverlay.y,
                type: 'scatter' as const,
                mode: 'lines' as const,
                name: 'IRF',
                xaxis: 'x', 
                yaxis: 'y', 
                line: {
                  color: colors.success,
                  width: 1.5,
                  dash: 'dash' as const,
                }
              }] : []),
              // Fit curve and residuals only exist once a fit has been run for this view
              ...(fitResult ? [
                {
                  x: decayTimes,
                  y: useLogScale
                    ? fitResult.fitted_curve.map(v => (v !== null ? Math.max(v, 0.5) : null))
                    : fitResult.fitted_curve,
                  type: 'scatter' as const,
                  mode: 'lines' as const,
                  name: 'Fit',
                  xaxis: 'x',
                  yaxis: 'y',
                  line: {
                    color: colors.destructive,
                    width: 2
                  }
                },
                //The Residuals (Bottom Panel)
                {
                  x: decayTimes,
                  y: residualSeries.inRange,
                  type: 'scatter' as const,
                  mode: 'markers' as const,
                  name: 'Residuals',
                  xaxis: 'x',
                  yaxis: 'y2',
                  marker: {
                    color: colors.foreground,
                    size: 4
                  }
                },
                // Residuals outside the fit window (model continued past the window, legacy behaviour)
                {
                  x: decayTimes,
                  y: residualSeries.outOfRange,
                  type: 'scatter' as const,
                  mode: 'markers' as const,
                  name: 'Residuals (outside fit)',
                  showlegend: false,
                  xaxis: 'x',
                  yaxis: 'y2',
                  marker: {
                    color: colors.foreground,
                    size: 3,
                    opacity: 0.3,
                  }
                },
              ] : []),
              commentMarkers
            ]}
            layout={{
              autosize: true, 
              // Changing uirevision drops user zoom, so the Fit View button bumps fitViewRevision
              uirevision: `${useLogScale}:${fitViewRevision}`,
              title: { 
                text: 'Fluorescence Decay', 
                font:{
                  size: 16
                } },
              plot_bgcolor: colors.card, 
              paper_bgcolor: colors.card,  
              showlegend: true,
              
              // Shared X-axis (anchored to the bottom residuals subplot)
              xaxis: {
                anchor: 'y2', // <-- Anchors the X axis & title to the bottom of the card
                showgrid: true,
                gridcolor: colors.border,   
                gridwidth: 1,     
                automargin: true,
                title: {
                  text: 'Time (ns)',
                  standoff: 15,
                  font: { size: 12 }
                }
              },
              
              
              // Main Y-axis (Decay & Fit)
              yaxis: {
                showgrid: true,
                gridcolor: colors.border,   
                gridwidth: 1,
                domain: [0.3, 1.0],
                type: useLogScale ? 'log' : 'linear',
                autorange: true,
                automargin: true,
                title: {
                  text: 'Counts',
                  standoff: 15,
                  font: { size: 12 }
                }
              },

              // Second Yaxis (Residuals)
              yaxis2: {
                showgrid: true,
                gridcolor: colors.border,
                gridwidth: 1,
                domain: [0.0, 0.22],
                automargin: true,
                title: { text: 'Residuals', font: { size: 12 } },
                zeroline: true,
                zerolinecolor: '#666666',
                zerolinewidth: 1,
              },
              
              font: {
                family: 'JetBrains Mono, monospace',
                size: 14,
                color: colors.foreground 
              },
              margin: { l: 80, r: 20, t: 50, b: 80 } 
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
