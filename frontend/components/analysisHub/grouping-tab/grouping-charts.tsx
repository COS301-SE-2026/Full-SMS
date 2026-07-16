import React from 'react'
import { useHdf5Data } from '@/contexts/hdf5Context/Hdf5DataContext'
import { Card } from '@/components/ui'
import Plot from 'react-plotly.js'
import { colors } from '@/lib/tokens'

export default function GroupingCharts() {
    let x_coords_intensity: number[] = []
    let y_coords_intensity: number[] = []
    const {hdf5Data, groupingData} = useHdf5Data();

    if(hdf5Data && hdf5Data?.counts.length !== 0 && hdf5Data?.time_bins.length !== 0){
        x_coords_intensity = hdf5Data.time_bins
        y_coords_intensity = hdf5Data.counts
    }

    //BIC optimization graph data
    const BIC: number[] = [] //y-axis
    const num_of_groups: number[] = []//x-axis
    
    if(groupingData){
       for(const step of groupingData.steps){
            BIC.push(step.bic)
            num_of_groups.push(step.groups.length)
       }
    }

    const markerColors = num_of_groups.map((_, index) => 
    index === groupingData?.optimal_step_index ? colors.success : colors.primary
  );

  return (
    <Card className='flex flex-col w-[83vw] h-[85vh] p-2 mt-1'>
        <div className='relative w-full h-[50%] min-w-0 min-h-0 overflow-hidden border border-destructive'>
            <Plot
                className="controls-above-plot"
                data={[
                    {
                    x: x_coords_intensity, 
                    y: y_coords_intensity, 
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
                    margin: { t: 40, r: 20, l: 40, b: 40 },
                    plot_bgcolor: colors.card, 
                    paper_bgcolor: colors.card,  
                    showlegend: false,
                    xaxis: {
                    showgrid: true,
                    gridcolor: colors.border,   
                    gridwidth: 1,     
                    title: 'Time (ms)' 
                }}}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
            />
        </div>
        <div className='flex flex-row h-[50%]'>
            <div className='w-[60%] border border-primary p-4'>
            <Plot
                className="controls-above-plot"
                data={[
                    {
                    x: num_of_groups, 
                    y: BIC, 
                    type: 'scatter', 
                    mode: 'lines+markers', 
                    name: 'Trace',
                    xaxis: 'x', 
                    yaxis: 'y', 
                    line: {
                        color: colors.primary, 
                        width: 4,          
                        dash: 'solid',     
                    },
                    marker:{
                        size: 14,
                        color: markerColors
                    }
                }]}
                layout={{
                    autosize: true, 
                    uirevision: 'true',
                    title: { text: 'BIC Optimization' },
                    margin: { t: 40, r: 20, l: 40, b: 40 },
                    plot_bgcolor: colors.card, 
                    paper_bgcolor: colors.card,  
                    xaxis: {
                        title:"Number of groups",
                        showgrid: true,
                        gridcolor: colors.border,
                        zeroline: false,

                    },
                    yaxis: {
                        title: 'BIC',
                        showgrid: true,
                        gridcolor: colors.border,
                        zeroline: false,
                    },
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
            />
            </div>
            <div className='w-[40%] border border-warning'>
                <table>
                    <thead>
                        <tr>
                            <th>Group</th>
                            <th>Levlels</th>
                            <th>Int cps</th>
                            <th> Dwell (s)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            groupingData?.steps[groupingData?.optimal_step_index].groups.map((group)=>(
                                <tr key={group.group_id}>
                                    <td>{group.group_id+1}</td>
                                    <td>{group.level_indices}</td>
                                    <td>{group.intensity_cps?.toPrecision(1)}</td>
                                    <td>{group.total_dwell_time_s}</td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
        </div>

    </Card>
  )
}
