import { Card } from "@/components/ui";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import { colors } from "@/lib/tokens";
import { getSpectraData } from "@/services/analysisServices";
import { SpectraData } from "@/types/analysis";
import React, { useEffect, useMemo, useState } from "react";
import Plot from "react-plotly.js";

export default function SpectraMap() {
  const {
    currentUpload,
    currentMeasurement,
    spectraHeatMapColor,
    setSpectraHeatMapColor,
  } = useHdf5Data();
  const [spectraData, setSpectraData] = useState<SpectraData>();
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
    fetchSpectraData();
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

  return (
    <div>
      <div className="flex items-center gap-4 h-12 px-4 border-b border-border bg-background flex-wrap z-10">
      <h3 className="text-foreground">Spectra</h3>
      <div className="flex items-center gap-4 h-12 px-4 border-b border-border bg-background flex-wrap z-10">
        <div className="flex items-center gap-2">
          <label className="text-xs text-foreground/70 whitespace-nowrap" htmlFor="heat-map">
            Colormap
          </label>
          <select
            name="heat-map"
            value={spectraHeatMapColor}
            onChange={(e) => setSpectraHeatMapColor(e.target.value)}
            className="w-20 h-7 px-2 rounded bg-card border border-border text-xs text-foreground text-right font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary appearance-none cursor-pointer"
          >
            {colourmaps.map((map) => (
              <option key={map} value={map}>
                {map}
              </option>
            ))}
          </select>
        </div>
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
                title: "Intensity",
                tickfont: { color: colors.foreground },
                titlefont: { color: colors.foreground },
              },
            },
          ]}
          layout={{
            title: {
              text: "Spectral Trace",
              font: { color: colors.foreground },
            },
            xaxis: {
              title: "Time (s)",
              color: colors.foreground,
              gridcolor: colors.border,
            },
            yaxis: {
              title: "Wavelength (nm)",
              color: colors.foreground,
              gridcolor: colors.border,
            },
            paper_bgcolor: colors.card,
            plot_bgcolor: colors.background,
            autosize: true,
            margin: { l: 60, r: 20, t: 40, b: 50 },
          }}
          useResizeHandler={true}
          style={{ width: "100%", height: "100%", minHeight: "400px" }}
        />
      </Card>
    </div>
  );
}
