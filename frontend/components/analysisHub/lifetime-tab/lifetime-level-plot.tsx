import { Button, ChartLoadingOverlay } from '@/components/ui'
import { useAnalysisTab } from '@/contexts/analysisTabsContext/AnalysisTabsContext'
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext'
import { useLifetimeLevelSelection } from '@/hooks/useLifetimeLevelSelection'
import { colors } from '@/lib/tokens'
import { intensityAnalysis } from '@/services/analysisServices'
import { LevelData } from '@/types/analysis'
import React, { useEffect, useMemo, useState } from 'react'
import Plot from 'react-plotly.js'

const NS_PER_MS = 1_000_000

// Each level as a horizontal segment, separated by nulls so Plotly draws one trace.
function levelSegments(levels: LevelData[], bin: number) {
  const x: (number | null)[] = []
  const y: (number | null)[] = []
  for (const level of levels) {
    const countsPerBin = level.intensity_cps * (bin / 1000)
    x.push(level.start_time_ns / NS_PER_MS, level.end_time_ns / NS_PER_MS, null)
    y.push(countsPerBin, countsPerBin, null)
  }
  return { x, y }
}

// Compact intensity trace: click a level to view its decay, as in the legacy Lifetime tab.
export default function LifetimeLevelPlot() {
  const { currentUpload, currentMeasurement, currentChannel, bin, cpaData } = useHdf5Data()
  const { selectedLevelIdx } = useAnalysisTab()
  const selectLevel = useLifetimeLevelSelection()
  const [trace, setTrace] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] })

  const levels = cpaData?.measurement_id === currentMeasurement ? cpaData?.levels ?? [] : []

  // Loading until the trace for the current measurement/channel/bin arrives (or fails)
  const requestKey = `${currentUpload}:${currentMeasurement}:${currentChannel}:${bin}`
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const loading = loadedKey !== requestKey

  useEffect(() => {
    if (!currentUpload || !currentMeasurement || levels.length === 0) {
      return}
    let cancelled = false
    void intensityAnalysis({
      upload_id: currentUpload,
      measurement_id: currentMeasurement,
      bin_size_ms: Number(bin),
      channel: currentChannel,
    })
      .then((response) => {
        if (!cancelled) {
          setTrace({ x: response.time_bins, y: response.counts })}
      })
      .catch((error) => console.error('Failed to load intensity trace:', error))
      .finally(() => {
        if (!cancelled) setLoadedKey(requestKey)
      })
    return () => {
      cancelled = true
    }
  }, [currentUpload, currentMeasurement, currentChannel, bin, levels.length])

  const allLevels = useMemo(() => levelSegments(levels, bin), [levels, bin])
  const selectedLevel = selectedLevelIdx === null ? undefined : levels[selectedLevelIdx]
  const selectedSegment = useMemo(
    () => levelSegments(selectedLevel ? [selectedLevel] : [], bin),
    [selectedLevel, bin],
  )

  if (levels.length === 0) {
    return null
}
  const handleClick = (event: Readonly<{ points?: { x?: unknown }[] }>) => {
    const clickedMs = Number(event.points?.[0]?.x)
    if (!Number.isFinite(clickedMs)){ 
      return}
    const idx = levels.findIndex(
      (level) =>
        level.start_time_ns / NS_PER_MS <= clickedMs && clickedMs <= level.end_time_ns / NS_PER_MS,
    )
    if (idx >= 0){
       void selectLevel(idx)}
  }

  const selectionText = selectedLevel? `Level ${selectedLevelIdx! + 1}: ${selectedLevel.num_photons.toLocaleString()} photons, ${Math.round(selectedLevel.intensity_cps).toLocaleString()} cps`: 'All data'

  return (
    <div className="mb-2">
      <div className="flex items-center gap-3 text-xs font-mono px-1">
        <span className="text-muted-foreground">Click a level to view its decay:</span>
        <Button variant="secondary" size="sm" onClick={() => void selectLevel(null)} disabled={selectedLevelIdx === null}>
          Show All
        </Button>
        <span className="text-primary">{selectionText}</span>
      </div>
      <div className="relative">
      <ChartLoadingOverlay loading={loading} />
      <Plot
        data={[
          {
            x: trace.x,
            y: trace.y,
            type: 'scatter',
            mode: 'lines',
            name: 'Trace',
            hoverinfo: 'x',
            line: { color: colors.primary, width: 0.5 },
          },
          {
            ...allLevels,
            type: 'scatter',
            mode: 'lines',
            name: 'Levels',
            hoverinfo: 'x',
            line: { color: colors.destructive, width: 2 },
          },
          {
            ...selectedSegment,
            type: 'scatter',
            mode: 'lines',
            name: 'Selected level',
            hoverinfo: 'skip',
            line: { color: colors.success, width: 5 },
          },
        ]}
        layout={{
          autosize: true,
          height: 160,
          showlegend: false,
          hovermode: 'x',
          uirevision: `${currentMeasurement}:${currentChannel}:${bin}`,
          plot_bgcolor: colors.card,
          paper_bgcolor: colors.card,
          xaxis: { title: { text: 'Time (ms)', font: { size: 11 } }, gridcolor: colors.border },
          yaxis: { title: { text: 'Counts/bin', font: { size: 11 } }, gridcolor: colors.border },
          font: { family: 'JetBrains Mono, monospace', size: 11, color: colors.foreground },
          margin: { l: 60, r: 20, t: 10, b: 40 },
        }}
        config={{ displayModeBar: false }}
        style={{ width: '100%' }}
        useResizeHandler
        onClick={handleClick}
      />
      </div>
    </div>
  )
}
