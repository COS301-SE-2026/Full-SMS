import React from 'react'
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext'
import { getClusteringLevels } from '@/services/analysisServices'
import { ClusteringReq, ClusteringRes } from '@/services/analysisServices'
import { Button, Card } from '@/components/ui'
import Plot from 'react-plotly.js'
import { colors } from '@/lib/tokens'
import { UseCeleryPolling } from '@/hooks/useCeleryPolling'

export default function GroupingCharts() {
    let x_coords: number[] = []
    let y_coords: number[] = []
    const {hdf5Data} = useHdf5Data();
    if(hdf5Data && hdf5Data?.counts.length !== 0 && hdf5Data?.time_bins.length !== 0){
        x_coords = hdf5Data.time_bins
        y_coords = hdf5Data.counts
    }

    //Fetching this way caused some kinf od timeout error
    // const fetchClusteringLevels = async () =>{
    //     const payload: ClusteringReq = {
    //         levels: levels
    //     }
    //     const response = await getClusteringLevels(payload)
    //     console.log(response);
        
    // }
    // fetchClusteringLevels()




  return (
    <Card className='flex flex-col w-[83vw] h-[85vh] p-2 mt-1'>
        <Card className='h-[55%] border border-destructive'>
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
                    }}]}
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
                }}}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
            />
        </Card>
        <div className='flex flex-row h-[45%]'>
            <Card className='w-[60%] border border-primary'></Card>
            <Card className='w-[40%] border border-warning'></Card>
        </div>

    </Card>
  )
}
