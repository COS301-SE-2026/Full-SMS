"use client";

import { FitResultData } from "@/types/plugin";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface FitResultRendererProps {
  data: FitResultData;
  label: string;
}

export default function FitResultRenderer({
  data,
  label,
}: Readonly<FitResultRendererProps>) {
  const parameters = data.parameters || {};
  const uncertainties = data.uncertainties || {};
  const metrics = data.metrics || {};
  const fittedCurve = data.fitted_curve;
  const model = data.model;

  const chartData =
    fittedCurve?.x?.map((x, i) => ({
      x,
      y: fittedCurve.y?.[i],
    })) || [];

  const paramEntries = Object.entries(parameters);
  const metricEntries = Object.entries(metrics).filter(
    ([, v]) => v !== null && v !== undefined,
  );

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-medium text-foreground">{label}</h4>
          {model && (
            <p className="text-xs text-muted-foreground">
              {model.name}
              {model.equation && `: ${model.equation}`}
            </p>
          )}
        </div>
        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
          Fit Result
        </span>
      </div>

      {chartData.length > 0 && (
        <div className="h-40 w-full mb-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis dataKey="x" tick={{ fontSize: 10 }} />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => v.toExponential(1)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  fontSize: 12,
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="y"
                name="Fit"
                stroke="hsl(var(--primary))"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="space-y-3">
        {paramEntries.length > 0 && (
          <div>
            <p className="text-xs font-medium text-foreground mb-1">
              Parameters
            </p>
            <div className="grid grid-cols-2 gap-1">
              {paramEntries.map(([name, value]) => (
                <div key={name} className="bg-muted/50 rounded p-1.5 text-xs">
                  <span className="text-muted-foreground">{name}:</span>
                  <span className="ml-1 text-foreground font-mono">
                    {typeof value === "number" ? value.toExponential(3) : value}
                  </span>
                  {uncertainties[name] !== undefined && (
                    <span className="text-muted-foreground">
                      {" "}
                      ± {uncertainties[name].toExponential(1)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {metricEntries.length > 0 && (
          <div>
            <p className="text-xs font-medium text-foreground mb-1">Metrics</p>
            <div className="grid grid-cols-3 gap-1">
              {metricEntries.map(([name, value]) => (
                <div key={name} className="bg-muted/50 rounded p-1.5 text-xs">
                  <span className="text-muted-foreground">
                    {formatMetricName(name)}:
                  </span>
                  <span className="ml-1 text-foreground font-mono">
                    {typeof value === "number" ? value.toFixed(4) : value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatMetricName(name: string): string {
  const names: Record<string, string> = {
    chi_squared: "χ²",
    reduced_chi_squared: "χ²ᵣ",
    r_squared: "R²",
    rmse: "RMSE",
    aic: "AIC",
    bic: "BIC",
  };
  return names[name] || name;
}
