import { Card } from '../../ui/Card';
import Plot from 'react-plotly.js'
import { useEffect, useMemo } from 'react';
import { colors } from '@/lib/tokens';
import { Intensity_Req } from '@/types/analysis';
import { intensityAnalysis } from '@/services/analysisServices';
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext';

export function IntensityChart() {
  let x_coords: number[] = []
  let y_coords: number[] = []
  const {setHdf5Data,hdf5Data, currentMeasurement, bin, cpaData, currentUpload} = useHdf5Data();
  if(hdf5Data && hdf5Data?.counts.length !== 0 && hdf5Data?.time_bins.length !== 0){
    x_coords = hdf5Data.time_bins
    y_coords = hdf5Data.counts
  }

    const fetchIntensityTrace= async ()=>{
      if(currentUpload){
        const request: Intensity_Req ={
        upload_id:currentUpload,
        measurement_id:currentMeasurement,
        bin_size_ms: Number(bin),
      }
      const response = await intensityAnalysis(request)
      setHdf5Data(response)
      }

    }
  
  
    useEffect(()=>{
      fetchIntensityTrace()
      },[currentMeasurement, bin, currentUpload]);

      
    const CpaLevels = useMemo(()=>{
      if(!cpaData){
        return { x: [], y: [] }
      }
      
        const x_axis = []
        const y_axis = []
        const million = 1000000
        if(cpaData?.levels)
        {for(const level of cpaData.levels){
          const start = level.start_time_ns / million
          const end = level.end_time_ns / million

          x_axis.push(start, end)
          y_axis.push((level.intensity_cps)*(bin/1000), (level.intensity_cps)*(bin/1000))

        }}
        return {x: x_axis, y:y_axis}
    }, [cpaData])

  


  return (
    <Card className="flex-1 flex flex-col p-4 min-w-0">
      <div className="flex-1 min-h-0 h-full overflow-hidden">
        <Plot
          data={[
            {
              x: x_coords, 
              y: y_coords, 
              type: 'scatter', 
              mode: 'lines', 
              name: 'Trace',
              xaxis: 'x', 
              yaxis: 'y', 
              line: {
                color: colors.primary, 
                width: 0.5,          
                dash: 'solid',     
              }
            },
            {
              x: cpaData?.measurement_id === currentMeasurement ? (CpaLevels?.x || []) : [],
              y: cpaData?.measurement_id === currentMeasurement ? (CpaLevels?.y || []) : [],
              type: 'scatter',
              mode: 'lines',
              name: 'CPA Levels',
              xaxis: 'x', 
              yaxis: 'y',
              line: { 
                color: colors.destructive,
                width: 2,
                shape: 'linear'
              }
            },
            {
              y: y_coords, 
              type: 'histogram',
              name: 'Distribution',
              xaxis: 'x2', //has its own x axiz
              yaxis: 'y',  
              marker: { color: colors.primary }
            }
          ]}
          layout={{
            autosize: true, 
            uirevision: 'true',
            title: { text: 'Intensity Trace' },
            plot_bgcolor: colors.card, 
            paper_bgcolor: colors.card,  
            showlegend: false,
            xaxis: {
              showgrid: true,
              gridcolor: colors.border,   
              gridwidth: 1,     
              domain: [0, 0.65],
              title: 'Time (ms)' 
            },
            
            xaxis2: {
              showgrid: true,
              gridcolor: colors.border,
              gridwidth: 1,
              domain: [0.72, 1],
              title: 'Counts',
              anchor: 'y'
            },

            yaxis: {
              showgrid: true,
              gridcolor: colors.border,   
              gridwidth: 1,
              range:[0,70],
              anchor: 'x',
              title: 'Intensity (cps)'
            },
            
            font: {
              family: 'JetBrains Mono, monospace',
              size: 14,
              color: colors.foreground 
            },
            margin: { l: 60, r: 20, t: 50, b: 50 } 
          }}
          revision={CpaLevels.x.length}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>
    </Card>
  );
}
