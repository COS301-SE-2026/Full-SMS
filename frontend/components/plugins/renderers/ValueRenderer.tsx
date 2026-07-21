"use client";

import { ValueData } from "@/types/plugin";

interface ValueRendererProps {
  data: ValueData;
  label: string;
}

export default function ValueRenderer({ data, label }: ValueRendererProps) {
  const formatValue = (val: ValueData): string => {
    if (typeof val === "number") {
      if (Number.isInteger(val)) {
        return val.toString();
      }
      return val.toFixed(6);
    }
    if (typeof val === "boolean") {
      return val ? "True" : "False";
    }
    return String(val);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <p className="text-sm text-foreground/60 mb-1">{label}</p>
      <p className="text-2xl font-mono font-semibold text-foreground">
        {formatValue(data)}
      </p>
    </div>
  );
}
