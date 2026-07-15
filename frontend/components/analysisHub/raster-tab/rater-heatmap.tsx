import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext';
import { getRasterData } from '@/services/analysisServices';
import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';

export function RasterHeatmap() {
    const [rasterData, setRasterData] = useState<any>(null);
    const { currentMeasurement, currentUpload } = useHdf5Data();
    
    const fetchRasterData = async () => {
        // Prevent fetching if we don't have the context IDs yet
        if (!currentUpload || !currentMeasurement) return;

        const payload = { upload_id: currentUpload, measurement_id: currentMeasurement };
        console.log("Payload: ", payload);
        
        try {
            const data = await getRasterData(payload);
            console.log("Fetched Raster Data:", data);
            setRasterData(data);
        } catch (error) {
            console.error("Failed to fetch raster data:", error);
        }
    };

    useEffect(() => {
        fetchRasterData();
    }, [currentMeasurement, currentUpload]);

    if (!rasterData || !rasterData.raster_scan) {
        return (
            <div className="flex h-full w-full items-center justify-center text-gray-500">
                Loading Raster Scan...
            </div>
        );
    }

    const { raster_scan, raster_scan_coord } = rasterData;
    
    // Calculate physical step sizes (um per pixel)
    const numRows = raster_scan.data.length;
    const numCols = raster_scan.data[0].length;
    const dx = raster_scan.scan_range / numCols;
    const dy = raster_scan.scan_range / numRows;

    return (
        <div className="h-full w-full">
            <Plot
                data={[
                    {
                        z: raster_scan.data,
                        type: 'heatmap',
                        colorscale: 'Viridis',
                        x0: raster_scan.x_start,
                        dx: dx,
                        y0: raster_scan.y_start,
                        dy: dy,
                        hoverinfo: 'x+y+z',
                        colorbar: { 
                            title: 'Intensity',
                            thickness: 15
                        }
                    },
                    {
                        x: [raster_scan_coord[0]],
                        y: [raster_scan_coord[1]],
                        type: 'scatter',
                        mode: 'markers',
                        marker: {
                            symbol: 'cross',
                            size: 14,
                            color: 'rgba(50, 255, 50, 1)',
                            line: {
                                color: 'rgba(50, 255, 50, 1)',
                                width: 3
                            }
                        },
                        name: 'Measurement Position',
                        hoverinfo: 'x+y',
                    }
                ]}
                layout={{
                    title: 'Raster Scan',
                    xaxis: { 
                        title: 'X Position (um)', 
                        zeroline: false 
                    },
                    yaxis: { 
                        title: 'Y Position (um)', 
                        scaleanchor: 'x', 
                        scaleratio: 1, 
                        zeroline: false 
                    },
                    plot_bgcolor: '#111111',
                    paper_bgcolor: 'transparent',
                    font: { color: '#e5e7eb' },
                    margin: { t: 40, r: 20, b: 50, l: 60 },
                    showlegend: false,
                    autosize: true
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%', minHeight: '500px' }}
            />
        </div>
    );
}