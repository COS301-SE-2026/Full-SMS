"use client";

import { DatasetData } from "@/types/plugin";

interface DatasetRendererProps {
  data: DatasetData;
  label: string;
}

export default function DatasetRenderer({
  data,
  label,
}: Readonly<DatasetRendererProps>) {
  const arrays = data.arrays || {};
  const arrayNames = Object.keys(arrays);

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-foreground">{label}</h4>
        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
          Dataset ({arrayNames.length} arrays)
        </span>
      </div>
      <div className="space-y-2">
        {arrayNames.map((name) => {
          const arr = arrays[name];
          const values = arr.values || [];
          return (
            <div key={name} className="bg-muted/50 rounded p-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{name}</span>
                <span className="text-muted-foreground">
                  {values.length} values{arr.unit ? ` (${arr.unit})` : ""}
                </span>
              </div>
              {arr.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {arr.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {data.metadata && Object.keys(data.metadata).length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1">Metadata:</p>
          <pre className="text-xs bg-muted/50 rounded p-2 overflow-auto max-h-24">
            {JSON.stringify(data.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
