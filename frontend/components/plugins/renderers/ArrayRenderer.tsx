"use client";

import { ArrayData } from "@/types/plugin";

interface ArrayRendererProps {
  data: ArrayData;
  label: string;
}

export default function ArrayRenderer({
  data,
  label,
}: Readonly<ArrayRendererProps>) {
  const values = Array.isArray(data) ? data : data.values || [];
  const unit =
    typeof data === "object" && !Array.isArray(data) ? data.unit : undefined;
  const dtype =
    typeof data === "object" && !Array.isArray(data) ? data.dtype : undefined;

  const stats = {
    length: values.length,
    min: values.length > 0 ? Math.min(...values) : 0,
    max: values.length > 0 ? Math.max(...values) : 0,
    mean:
      values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-foreground">{label}</h4>
        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
          Array{unit ? ` (${unit})` : ""}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="bg-muted/50 rounded p-2">
          <span className="text-muted-foreground">Length:</span>
          <span className="ml-1 text-foreground">{stats.length}</span>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <span className="text-muted-foreground">Type:</span>
          <span className="ml-1 text-foreground">{dtype || "float64"}</span>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <span className="text-muted-foreground">Min:</span>
          <span className="ml-1 text-foreground">{stats.min.toFixed(4)}</span>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <span className="text-muted-foreground">Max:</span>
          <span className="ml-1 text-foreground">{stats.max.toFixed(4)}</span>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        Mean: {stats.mean.toFixed(4)}
      </div>
    </div>
  );
}
