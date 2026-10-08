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
    const { currentMeasurement, currentUpload, bin, currentChannel, hdf5Metadata } = useHdf5Data()
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
      setIrfTimes
    } = useAnalysisTab()
    
    const { progressSpot, setProgressSpot, noteText, setNoteText, controlPlotClick, controlSubmitNote } = useCommentClick(onAddComment);
    const commentMarkers = buildCommentMarkers(comments, 'x', 'y');
    const useNativeBlocksViewer = hdf5Metadata?.data_kind ==="native_data"

    useEffect(() => {
      const fetchLifetimeData = async () => {
        if (!currentUpload || !currentMeasurement) return; 
    
        const payload = {
          "upload_id": currentUpload,
          "measurement_id": currentMeasurement,
          "bin_size_ms": bin,
          "channel": currentChannel
        };
        try {
          const response = await getFluorescenceDecay(payload)
          setDecayTimes(response.times)
          setDecayCounts(response.counts)
          if (response.irf) {
            setIrfTimes(response.irf.t || response.times)
            setIrfCounts(response.irf.counts || [])
          } else {
            setIrfTimes([])
            setIrfCounts([])
          }
        } catch (error) {
          console.error(error)
        }
      };
      
      fetchLifetimeData();
    }, [currentMeasurement, currentUpload, currentChannel])

    // Scale the IRF to the data peak (legacy behavior)
    const scaledIrfCounts = React.useMemo(() => {
      if (!irfCounts || irfCounts.length === 0 || !decayCounts || decayCounts.length === 0) return [];
      let maxData = 0;
      for (let i = 0; i < decayCounts.length; i++) {
        if (decayCounts[i] > maxData) maxData = decayCounts[i];
      }
      let maxIrf = 0;
      for (let i = 0; i < irfCounts.length; i++) {
        if (irfCounts[i] > maxIrf) maxIrf = irfCounts[i];
      }
      const scale = maxIrf > 0 ? maxData / maxIrf : 1;
      return irfCounts.map(c => c * scale);
    }, [irfCounts, decayCounts]);

  return (
    <div>
      <Card className="flex-1 flex flex-col p-2 min-w-0">
        <div className="flex-1 min-h-0 h-full overflow-hidden">
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
              ...(showIRF && scaledIrfCounts.length > 0 ? [{
                x: irfTimes.length === scaledIrfCounts.length ? irfTimes : decayTimes,
                y: useLogScale ? scaledIrfCounts.map(c => Math.max(c, 0.5)) : scaledIrfCounts,
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
              // The Fitting
              {
                //  If the backend only returns the fitted curve for the sliced index range, 
                //slice xAxis here to match fitCurve.length
                x: decayTimes,
                y:useLogScale && fitResult?.fitted_curve
                  ? fitResult.fitted_curve.map(v => (v !== null ? Math.max(v, 0.5) : null))
                  : fitResult?.fitted_curve,// fit curve
                type: 'scatter',
                mode: 'lines',
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
                y: fitResult?.residuals,//residuals 
                type: 'scatter',
                mode: 'markers',
                name: 'Residuals',
                xaxis: 'x',
                yaxis: 'y2',
                marker: { 
                  color: colors.foreground,
                  size: 4
                }
              },
              commentMarkers
            ]}
            layout={{
              autosize: true, 
              uirevision: String(useLogScale),
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
