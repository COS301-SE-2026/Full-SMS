import React from 'react'
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext'

export default function RasterToolbar() {
    const {setHeatMapColor, heatMapColor} = useHdf5Data()
    const colourmaps = ["Plasma","Viridis", "Inferno", "Hot", "Cool", "Twilight"]

    return (
    <div className="flex items-center gap-4 h-12 px-4 border-b border-border bg-background flex-wrap z-10">
    <div className="flex items-center gap-2">
        <label className="text-xs text-foreground/70 whitespace-nowrap">Colormap</label>
            <select
            value={heatMapColor}
            onChange={(e) =>(setHeatMapColor(e.target.value))}
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
    )
}
