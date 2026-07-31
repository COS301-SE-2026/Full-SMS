"use client";

import { PluginParameter, ParameterFormProps } from "@/types/plugin";

export default function ParameterForm({
  parameters,
  values,
  onChange,
}: Readonly<ParameterFormProps>) {
  const handleChange = (id: string, value: unknown) => {
    onChange({ ...values, [id]: value });
  };

  const renderParameter = (param: PluginParameter) => {
    const currentValue = values[param.id] ?? param.default;

    switch (param.type) {
      case "number":
      case "range":
        return (
          <div key={param.id} className="flex items-center gap-2">
            <label className="text-xs text-foreground/70 whitespace-nowrap">
              {param.label}
            </label>
            <input
              type="range"
              min={param.min ?? 0}
              max={param.max ?? 100}
              step={param.step ?? 1}
              value={currentValue as number}
              onChange={(e) => handleChange(param.id, Number(e.target.value))}
              className="w-24 h-1.5 rounded-lg appearance-none bg-border cursor-pointer accent-primary"
            />
            <input
              type="number"
              min={param.min}
              max={param.max}
              step={param.step}
              value={currentValue as number}
              onChange={(e) => handleChange(param.id, Number(e.target.value))}
              className="w-16 h-7 px-2 rounded bg-card border border-border text-xs text-foreground text-right font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        );

      case "select":
        return (
          <div key={param.id} className="flex items-center gap-2">
            <label className="text-xs text-foreground/70 whitespace-nowrap">
              {param.label}
            </label>
            <select
              value={currentValue as string}
              onChange={(e) => handleChange(param.id, e.target.value)}
              className="w-20 h-7 px-2 rounded bg-card border border-border text-xs text-foreground font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary appearance-none cursor-pointer"
            >
              {param.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );

      case "checkbox":
        return (
          <div key={param.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`param-${param.id}`}
              checked={currentValue as boolean}
              onChange={(e) => handleChange(param.id, e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50"
            />
            <label
              htmlFor={`param-${param.id}`}
              className="text-xs text-foreground/70"
            >
              {param.label}
            </label>
          </div>
        );

      case "text":
        return (
          <div key={param.id} className="flex items-center gap-2">
            <label className="text-xs text-foreground/70 whitespace-nowrap">
              {param.label}
            </label>
            <input
              type="text"
              value={currentValue as string}
              onChange={(e) => handleChange(param.id, e.target.value)}
              className="w-24 h-7 px-2 rounded bg-card border border-border text-xs text-foreground font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (parameters.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      {parameters.map(renderParameter)}
    </div>
  );
}
