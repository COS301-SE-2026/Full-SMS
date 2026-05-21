import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card } from '../ui/Card';
import { Brush } from 'recharts';
import intensityPoints from '@/app/demo-data/intensity_points';
import { useHdf5Data } from '@/contexts/Hdf5DataContext';

export function PhotonChart() {
  const [data, setData] = useState([] as { x: number; y: number }[]);
  const { hdf5Data } = useHdf5Data()

  useEffect(() => {
    if (hdf5Data) {
      setData(intensityPoints);
    }
  }, [hdf5Data]);

  return (
    <Card className="flex-1 flex flex-col p-4 min-w-0">
      <h4 className="mb-3">Photon Count Rate vs. Time</h4>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid stroke="#3a3a3a" strokeDasharray="2 4" />
            <XAxis
              dataKey="x"
              stroke="#888"
              tick={{ fill: '#bbb', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickLine={{ stroke: '#3a3a3a' }}
              axisLine={{ stroke: '#3a3a3a' }}
              label={{
                value: 'Time (s)',
                position: 'insideBottom',
                offset: -8,
                fill: '#bbb',
                fontSize: 12,
              }}
              interval={5000}
            />
            <YAxis
              stroke="#888"
              domain={[0, 80]}
              ticks={[0, 450, 900, 1350, 1800]}
              tick={{ fill: '#bbb', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickLine={{ stroke: '#3a3a3a' }}
              axisLine={{ stroke: '#3a3a3a' }}
              label={{
                value: 'Intensity (counts/s)',
                angle: -90,
                position: 'insideLeft',
                fill: '#bbb',
                fontSize: 12,
                style: { textAnchor: 'middle' },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E1E1E',
                border: '1px solid #3a3a3a',
                borderRadius: 4,
                fontSize: 12,
              }}
              labelStyle={{ color: '#e8e8e8' }}
              itemStyle={{ color: '#00e5ff' }}
            />
            <Line
              type="monotone"
              dataKey="y"
              stroke="#00e5ff"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
