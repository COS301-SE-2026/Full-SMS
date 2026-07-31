"use client";

import { TableData } from "@/types/plugin";

interface TableRendererProps {
  data: TableData;
  label: string;
}

export default function TableRenderer({ data, label }: TableRendererProps) {
  const { columns, rows, title } = data;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-2 border-b border-border">
        <h4 className="text-sm font-medium text-foreground">
          {title || label}
        </h4>
      </div>
      <div className="overflow-x-auto max-h-64">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-card/50">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="px-4 py-2 text-left font-medium text-foreground/60 border-b border-border"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-border last:border-b-0 hover:bg-card/30"
              >
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-2 text-foreground">
                    {typeof cell === "number" ? cell.toFixed(4) : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-border text-xs text-foreground/40">
        {rows.length} rows
      </div>
    </div>
  );
}
