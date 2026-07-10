import { useMemo } from 'react';
import { Card } from '../ui/Card';
import intensityPoints from '@/app/demo-data/intensity_points';
import { useHdf5Data } from '@/contexts/Hdf5DataContext';
import Plot from 'react-plotly.js'

import { colors } from '@/lib/tokens';

export function IntensityChart() {
  const { hdf5Data } = useHdf5Data()
  const x_coords = intensityPoints.map(point => point.x);
  const y_coords = intensityPoints.map(point => point.y);

  return (
    <Card className="flex-1 flex flex-col p-4 min-w-0">
      <h4 className="mb-3"></h4>
      <div className="flex-1 min-h-0 h-full overflow-hidden">
        <Plot
          data={[
            {
              x: x_coords, 
              y: y_coords, 
              type: 'scatter', 
              mode: 'lines+markers', 
              name: 'Trace',
              xaxis: 'x', // Left chart X-axis
              yaxis: 'y', // Shared Y-axis anchor
              line: {
                color: colors.primary, // Applied your theme token properly
                width: 0.5,          
                dash: 'solid',     
              },
              marker: {
                size: 1,           
              }
            },
            {
              y: y_coords, // Utilizes binned data targeting the shared scale
              type: 'histogram',
              name: 'Distribution',
              xaxis: 'x2', // Right chart X-axis
              yaxis: 'y',  // SHARED: Aligns directly with scatter horizontal plane
              marker: { color: colors.primary }
            }
          ]}
          layout={{
            autosize: true, 
            title: { text: 'Intensity Trace' },
            plot_bgcolor: colors.card, 
            paper_bgcolor: colors.card,  
            showlegend: false, // Prevents elements from overlapping layout borders
            
            // --- SUBPLOT GRID INJECTION ---
            grid: {
              rows: 1,
              columns: 2,
              pattern: 'independent'
            },
            
            // --- SCATTER X-AXIS (LEFT) ---
            xaxis: {
              showgrid: true,
              gridcolor: colors.border,   
              gridwidth: 1,           
              domain: [0, 0.65], // Allocates left 65% of screen width
            },
            
            // --- HISTOGRAM X-AXIS (RIGHT) ---
            xaxis2: {
              showgrid: true,
              gridcolor: colors.border,
              gridwidth: 1,
              domain: [0.72, 1], // Allocates remaining space with a tidy structural gap
              anchor: 'y'
            },

            // --- DECLARED SINGLE SHARED Y-AXIS ---
            yaxis: {
              showgrid: true,
              gridcolor: colors.border,   
              gridwidth: 1,           
              anchor: 'x' // Pairs system with the scatter layout framework
            },
            
            font: {
              family: 'JetBrains Mono, monospace', // Fixed fall-back font syntax
              size: 14,
              color: '#333333'
            },
            // Controls margins so labels don't get trimmed dynamically
            margin: { l: 50, r: 20, t: 50, b: 40 }
          }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>
    </Card>
  );
}
