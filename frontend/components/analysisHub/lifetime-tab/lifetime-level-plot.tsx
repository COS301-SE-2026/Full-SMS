import { Button, ChartLoadingOverlay } from '@/components/ui'
import { useAnalysisTab } from '@/contexts/analysisTabsContext/AnalysisTabsContext'
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext'
import { useLifetimeSelection } from '@/hooks/useLifetimeSelection'
import { groupLevels, groupPhotonCount, selectedGroups } from '@/lib/lifetimeTargets'
import { colors } from '@/lib/tokens'
import { intensityAnalysis } from '@/services/analysisServices'
import { LevelData } from '@/types/analysis'
import React, { useEffect, useMemo, useState } from 'react'
import Plot from 'react-plotly.js'

const NS_PER_MS = 1_000_000

// Readable on the dark card background (the first chart colour is too dark)
const GROUP_COLORS = [colors.chart[2], colors.chart[3], colors.chart[1], colors.chart[4], colors.warning, colors.destructive]

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

// Compact intensity trace: click a level (or, in Groups mode, a level's group) to view its
// decay, as in the legacy Lifetime tab.
export default function LifetimeLevelPlot() {
  const { currentUpload, currentMeasurement, currentChannel, bin, cpaData, groupingData } = useHdf5Data()
  const { selectedLevelIdx, selectedGroupIdx } = useAnalysisTab()
  const { selectLevel, selectGroup } = useLifetimeSelection()
  const [trace, setTrace] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] })
  const [mode, setMode] = useState<'levels' | 'groups'>(selectedGroupIdx === null ? 'levels' : 'groups')

  const levels = useMemo(
    () => (cpaData?.measurement_id === currentMeasurement ? cpaData?.levels ?? [] : []),
    [cpaData, currentMeasurement],
  )
  const groups = useMemo(() => selectedGroups(groupingData), [groupingData])
  const hasGroups = groups.length > 0
  const showGroups = mode === 'groups' && hasGroups

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
  }, [currentUpload, currentMeasurement, currentChannel, bin, levels.length, requestKey])

  // Levels as one red trace, or one coloured trace per group
  const levelTraces = useMemo(() => {
    if (!showGroups) {
      return [{ ...levelSegments(levels, bin), name: 'Levels', color: colors.destructive }]
    }
    return groups.map((group, idx) => ({
      ...levelSegments(groupLevels(group, levels) ?? [], bin),
      name: `Group ${group.group_id + 1}`,
      color: GROUP_COLORS[idx % GROUP_COLORS.length],
    }))
  }, [showGroups, levels, groups, bin])

  const selectedGroup = selectedGroupIdx === null ? undefined : groups[selectedGroupIdx]
  const selectedGroupMembers = selectedGroup ? groupLevels(selectedGroup, levels) : null
  const selectedLevel = selectedLevelIdx === null ? undefined : levels[selectedLevelIdx]
  const highlighted = useMemo(
    () => levelSegments(selectedGroupMembers ?? (selectedLevel ? [selectedLevel] : []), bin),
    [selectedGroupMembers, selectedLevel, bin],
  )

  if (levels.length === 0) {
    return null
}
  const handleClick = (event: Readonly<{ points?: { x?: unknown }[] }>) => {
    const clickedMs = Number(event.points?.[0]?.x)
    if (!Number.isFinite(clickedMs)){
      return}
    const levelIdx = levels.findIndex(
      (level) =>
        level.start_time_ns / NS_PER_MS <= clickedMs && clickedMs <= level.end_time_ns / NS_PER_MS,
    )
    if (levelIdx < 0) return
    if (showGroups) {
      const groupIdx = groups.findIndex((group) => group.level_indices.includes(levelIdx))
      if (groupIdx >= 0) void selectGroup(groupIdx)
    } else {
      void selectLevel(levelIdx)
    }
  }

  let selectionText = 'All data'
  if (selectedGroup && selectedGroupMembers) {
    selectionText = `Group ${selectedGroup.group_id + 1}: ${selectedGroupMembers.length} levels, ${groupPhotonCount(selectedGroupMembers).toLocaleString()} photons, ${Math.round(selectedGroup.intensity_cps).toLocaleString()} cps`
  } else if (selectedLevel) {
    selectionText = `Level ${selectedLevelIdx! + 1}: ${selectedLevel.num_photons.toLocaleString()} photons, ${Math.round(selectedLevel.intensity_cps).toLocaleString()} cps`
  }

  return (
    <div className="mb-2">
      <div className="flex items-center gap-3 text-xs font-mono px-1">
        <span className="text-muted-foreground">
          {showGroups ? 'Click a level to view its group’s decay:' : 'Click a level to view its decay:'}
        </span>
        {hasGroups && (
          <div className="flex rounded border border-border overflow-hidden" role="group" aria-label="Select by">
            {(['levels', 'groups'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={mode === option}
                onClick={() => setMode(option)}
                className={`px-2 py-0.5 capitalize ${mode === option ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void selectLevel(null)}
          disabled={selectedLevelIdx === null && selectedGroupIdx === null}
        >
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
          ...levelTraces.map((levelTrace) => ({
            x: levelTrace.x,
            y: levelTrace.y,
            type: 'scatter' as const,
            mode: 'lines' as const,
            name: levelTrace.name,
            hoverinfo: 'x+name' as const,
            line: { color: levelTrace.color, width: 2 },
          })),
          {
            ...highlighted,
            type: 'scatter',
            mode: 'lines',
            name: 'Selected',
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
