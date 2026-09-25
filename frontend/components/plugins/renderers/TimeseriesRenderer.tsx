"use client";

import { TimeseriesData } from "@/types/plugin";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface TimeseriesRendererProps {
  data: TimeseriesData;
  label: string;
}

export default function TimeseriesRenderer({
  data,
  label,
}: Readonly<TimeseriesRendererProps>) {
  const time = data.time || [];
  const values = data.values || [];
  const timeUnit = data.timeUnit || "s";
  const valueUnit = data.valueUnit;

  const chartData = time.map((t, i) => ({ time: t, value: values[i] }));

  const stats = {
    points: values.length,
    duration: time.length > 1 ? time[time.length - 1] - time[0] : 0,
    mean:
      values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-foreground">{label}</h4>
        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
          Time Series
        </span>
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => v.toFixed(2)}
              label={{
                value: `Time (${timeUnit})`,
                position: "bottom",
                fontSize: 10,
              }}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => v.toExponential(1)}
              label={
                valueUnit
                  ? {
                      value: valueUnit,
                      angle: -90,
                      position: "insideLeft",
                      fontSize: 10,
                    }
                  : undefined
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                fontSize: 12,
              }}
              formatter={(value: number) => [value.toExponential(3), "Value"]}
              labelFormatter={(label) => `Time: ${label} ${timeUnit}`}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              dot={false}
              strokeWidth={1.5}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
        <div className="bg-muted/50 rounded p-2">
          <span className="text-muted-foreground">Points:</span>
          <span className="ml-1 text-foreground">{stats.points}</span>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <span className="text-muted-foreground">Duration:</span>
          <span className="ml-1 text-foreground">
            {stats.duration.toFixed(2)} {timeUnit}
          </span>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <span className="text-muted-foreground">Mean:</span>
          <span className="ml-1 text-foreground">
            {stats.mean.toExponential(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
