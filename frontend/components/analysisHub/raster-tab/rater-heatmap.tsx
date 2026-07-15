import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext';
import { getRasterData } from '@/services/analysisServices';
import { log } from 'console';
import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';

export function RasterHeatmap() {
    const [rasterData, setRasterData] = useState()
    const {currentMeasurement, currentUpload} = useHdf5Data()
    
    const fetchRasterData = async ()=>{
        const payload = {upload_id: currentUpload, measurement_id: currentMeasurement}
        console.log("Paylod: ", payload);
        
        const data = await getRasterData(payload)
        console.log(data);
        setRasterData(data)
    }

    useEffect(()=>{
        fetchRasterData()
    },[currentMeasurement])


    return (
        <Plot
            // data={[
            // {
            //     z: rasterData?.raster_scan.data,
            //     type: 'heatmap',
            //     colorscale: 'Plasma', // Matches dpg.mvPlotColormap_Plasma
            //     x0: rasterData?.raster_scan.x_start, // Start X coordinate
            //     dx: (rasterData?.raster_scan_coord[0] - rasterData?.raster_scan.x_start) / rasterData?.raster_scan.pixels_per_line, // X step size
            //     y0: rasterData.raster_scan.y_start, // Start Y coordinate
            //     dy: (rasterData.raster_coord[1] - rasterData.raster_scan.y_start) / rasterData.raster_scan.pixels_per_line, // Y step size
            //     zmin: 0,
            //     zmax: 60,
            // }
            // ]}
            // layout={{
            //     title: 'Raster Scan',
            //     xaxis: { title: 'X Position (um)' },
            //     yaxis: { title: 'Y Position (um)', scaleanchor: 'x', scaleratio: 1 }, // Keeps aspect ratio square
            // }}
        />
    );
}