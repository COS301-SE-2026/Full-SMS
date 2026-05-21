import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card } from '../ui/Card';

function generateBins() {
  const bins = [
    65, 194, 323, 452, 581, 710, 839, 968, 1097, 1226, 1355, 1484, 1613, 1742, 1871,
  ];
  const profile = [200, 700, 1500, 1850, 1500, 1100, 700, 350, 800, 850, 400, 100, 50, 20, 10];
  return bins.map((b, i) => ({
    bin: b,
    count: profile[i] + Math.round((Math.random() - 0.5) * 80),
  }));
}

export function IntensityHistogram() {
  const data = useMemo(generateBins, []);

  return (
    <Card className="w-[220px] shrink-0 flex flex-col p-4">
      <h4 className="mb-3">Intensity Histogram</h4>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 10, bottom: 20, left: 0 }}
          >
            <CartesianGrid stroke="#3a3a3a" strokeDasharray="2 4" horizontal={false} />
            <XAxis
              type="number"
              stroke="#888"
              domain={[0, 2000]}
              ticks={[0, 500, 1000, 1500, 2000]}
              tick={{ fill: '#bbb', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={{ stroke: '#3a3a3a' }}
              axisLine={{ stroke: '#3a3a3a' }}
            />
            <YAxis
              type="category"
              dataKey="bin"
              stroke="#888"
              tick={{ fill: '#bbb', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={{ stroke: '#3a3a3a' }}
              axisLine={{ stroke: '#3a3a3a' }}
              width={42}
              reversed
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
              cursor={{ fill: 'rgba(0,229,255,0.08)' }}
            />
            <Bar dataKey="count" fill="#00e5ff" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
