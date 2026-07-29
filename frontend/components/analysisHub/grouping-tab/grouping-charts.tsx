import React, { useMemo, useState } from "react"
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext"
import { Card } from "@/components/ui"
import Plot from "react-plotly.js"
import { colors } from "@/lib/tokens"

export default function GroupingCharts() {
  let x_coords_intensity: number[] = []
  let y_coords_intensity: number[] = []
  const [selectedGroup, setSelectedGroup] = useState<number>()
  const { hdf5Data, groupingData, cpaData, bin, currentMeasurement } =
    useHdf5Data()

  if (
    hdf5Data &&
    hdf5Data?.counts.length !== 0 &&
    hdf5Data?.time_bins.length !== 0
  ) {
    x_coords_intensity = hdf5Data.time_bins
    y_coords_intensity = hdf5Data.counts
  }

  //BIC optimization graph data
  const BIC: number[] = [] //y-axis
  const num_of_groups: number[] = [] //x-axis

  if (groupingData) {
    for (const step of groupingData.steps) {
      BIC.push(step.bic);
      num_of_groups.push(step.groups.length)
    }
  }

  const CpaLevels = useMemo(() => {
    if (!cpaData) {
      return { x: [], y: [] }
    }

    const x_axis = [];
    const y_axis = [];
    const million = 1000000;
    if (cpaData?.levels) {
      for (const level of cpaData.levels) {
        const start = level.start_time_ns / million;
        const end = level.end_time_ns / million;

        x_axis.push(start, end);
        y_axis.push(
          level.intensity_cps * (bin / 1000),
          level.intensity_cps * (bin / 1000),
        );
      }
    }
    return { x: x_axis, y: y_axis }
  }, [cpaData]);

  const groupingOverlays = useMemo(() => {
    if (!groupingData?.steps) {
      return [];
    }

    const currentStepidx =
      selectedGroup !== undefined
        ? selectedGroup
        : groupingData.optimal_step_index;
    const currentStep = groupingData.steps[currentStepidx]

    const sortedStepGroups = [...currentStep.groups].sort(
      (a, b) => a.intensity_cps - b.intensity_cps,
    );
    const groupIntensities = sortedStepGroups.map(
      (g) => g.intensity_cps * (bin / 1000),
    );
    const overlays: any[] = [];

    const max_y = Math.max(...y_coords_intensity);
    for (let i = 0; i < sortedStepGroups.length; i++) {
      const groupIntensity = groupIntensities[i]

      const floor =
        i === 0 ? 0 : groupIntensities[i - 1] + groupIntensities[i] / 2

      const ceiling =
        i === sortedStepGroups.length - 1
          ? max_y * 1.1
          : groupIntensities[i] + groupIntensities[i + 1] / 2

      overlays.push({
        type: "rect",
        xref: "paper", // Spans the entire width of the plot
        x0: 0,
        x1: 1,
        yref: "y",
        y0: floor,
        y1: ceiling,
        // fillcolor:colors.success,
        line: { width: 0 },
        layer: "below", 
      });
      overlays.push({
        type: "line",
        xref: "paper",
        x0: 0,
        x1: 1,
        yref: "y",
        y0: groupIntensity,
        y1: groupIntensity,
        line: {
          color: colors.warning,
          width: 1,
          dash: "dash",
        },
        layer: "below",
      })
    }

    return overlays
  }, [groupingData, selectedGroup, y_coords_intensity, bin])

  const markerColors = num_of_groups.map((_, index) => {
    if (index === selectedGroup) {
      return colors.destructive
    }
    return index === groupingData?.optimal_step_index
      ? colors.success
      : colors.primary
  });

  const handleGroupSelect = (e: any) => {
    if (e.points && e.points.length > 0) {
      const groupIdx = e.points[0].pointIndex;
      setSelectedGroup(groupIdx)
    }
  };

  return (
    <Card className="flex flex-col w-[83vw] h-[85vh] p-2 mt-1 gap-4">
      <div className="relative w-full h-[50%] min-w-0 min-h-0 overflow-hidden">
        <Plot
          className="controls-above-plot"
          data={[
            {
              x: x_coords_intensity,
              y: y_coords_intensity,
              type: "scatter",
              mode: "lines",
              name: "Trace",
              xaxis: "x",
              yaxis: "y",
              line: {
                color: colors.primary,
                width: 0.5,
                dash: "solid",
              },
            },
            {
              x:
                cpaData?.measurement_id === currentMeasurement
                  ? CpaLevels?.x || []
                  : [],
              y:
                cpaData?.measurement_id === currentMeasurement
                  ? CpaLevels?.y || []
                  : [],
              type: "scatter",
              mode: "lines",
              name: "CPA Levels",
              xaxis: "x",
              yaxis: "y",
              line: {
                color: colors.destructive,
                width: 2,
                shape: "linear",
              },
            },
          ]}
          layout={{
            uirevision: "true",
            title: { text: "Intensity Trace" },
            margin: { t: 40, r: 20, l: 40, b: 40 },
            plot_bgcolor: colors.card,
            paper_bgcolor: colors.card,
            showlegend: false,
            shapes:groupingOverlays,
            xaxis: {
              showgrid: true,
              gridcolor: colors.border,
              gridwidth: 1,
              title: "Time (ms)",
            },
            yaxis: {
              range: [0, Math.max(...y_coords_intensity)],
              autorange: false,
            },
          }}
          useResizeHandler={true}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <div className="flex flex-row h-[50%]">
        <div className="w-[60%] p-4">
          <Plot
            className="controls-above-plot"
            data={[
              {
                x: num_of_groups,
                y: BIC,
                type: "scatter",
                mode: "lines+markers",
                name: "Trace",
                xaxis: "x",
                yaxis: "y",
                line: {
                  color: colors.primary,
                  width: 4,
                  dash: "solid",
                },
                marker: {
                  size: 14,
                  color: markerColors,
                },
              },
            ]}
            layout={{
              autosize: true,
              uirevision: "true",
              title: { text: "BIC Optimization" },
              margin: { t: 40, r: 20, l: 40, b: 40 },
              plot_bgcolor: colors.card,
              paper_bgcolor: colors.card,
              xaxis: {
                title: "Number of groups",
                showgrid: true,
                gridcolor: colors.border,
                zeroline: false,
              },
              yaxis: {
                title: "BIC",
                showgrid: true,
                gridcolor: colors.border,
                zeroline: false,
              },
            }}
            onClick={handleGroupSelect}
            useResizeHandler={true}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
        <div className="w-[40%] text-sm font-mono">
          <table className="table-auto w-full">
            <thead className="bg-border/60">
              <tr>
                <th>Group</th>
                <th>Levels</th>
                <th>Int cps</th>
                <th> Dwell (s)</th>
              </tr>
            </thead>
            <tbody>
              {groupingData?.steps[
                selectedGroup ? selectedGroup : groupingData?.optimal_step_index
              ].groups.map((group) => (
                <tr key={group.group_id}>
                  <td className="text-center">{group.group_id + 1}</td>
                  <td className="text-center">{group.level_indices.length}</td>
                  <td className="text-center">
                    {Math.round(group.intensity_cps)}
                  </td>
                  <td className="text-center">
                    {group.total_dwell_time_s.toPrecision(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
