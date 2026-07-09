import { useMemo } from 'react';
import { Card } from '../ui/Card';
import intensityPoints from '@/app/demo-data/intensity_points';
import { useHdf5Data } from '@/contexts/Hdf5DataContext';
import Plot from 'react-plotly.js'

import { colors } from '@/lib/tokens';

export function IntensityChart() {
  const { hdf5Data } = useHdf5Data()
  const data = useMemo(() => (hdf5Data ? intensityPoints : []), [hdf5Data])

  return (
    <Card className="flex-1 flex flex-col p-4 min-w-0">
      <h4 className="mb-3"></h4>
      <div className="flex-1 min-h-0">
      <Plot
        data={[{x: [1, 2, 3], y: [2, 6, 3], type: 'scatter', mode:'lines+markers', color: colors.primary}]}
        layout={{autosize: true, title: {text: 'Responsive'}}}
        style={{width: '100%', height: '100%'}}
        useResizeHandler
      />
      </div>
    </Card>
  );
}
