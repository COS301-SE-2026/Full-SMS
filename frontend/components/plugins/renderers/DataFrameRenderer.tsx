"use client";

import { DataframeData } from "@/types/plugin";

interface DataframeRendererProps {
  data: DataframeData;
  label: string;
}

export default function DataframeRenderer({
  data,
  label,
}: Readonly<DataframeRendererProps>) {
  const columns = data.columns || [];
  const numRows = columns[0]?.values?.length || 0;
  const displayRows = Math.min(numRows, 10);

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-foreground">{label}</h4>
        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
          Dataframe ({numRows} rows × {columns.length} cols)
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="text-left p-1.5 font-medium text-foreground bg-muted/50"
                >
                  <div>{col.name}</div>
                  <div className="text-[10px] text-muted-foreground font-normal">
                    {col.dtype}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: displayRows }).map((_, rowIdx) => (
              <tr key={rowIdx} className="border-b border-border/50">
                {columns.map((col, colIdx) => {
                  const value = col.values[rowIdx];
                  return (
                    <td key={colIdx} className="p-1.5 font-mono">
                      {formatCellValue(value, col.dtype)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {numRows > displayRows && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Showing {displayRows} of {numRows} rows
          </p>
        )}
      </div>
    </div>
  );
}

function formatCellValue(value: unknown, dtype: string): string {
  if (value === null || value === undefined) return "—";
  if (dtype === "float64" || dtype === "float32") {
    return typeof value === "number" ? value.toFixed(4) : String(value);
  }
  if (dtype === "bool") {
    return value ? "true" : "false";
  }
  return String(value);
}
