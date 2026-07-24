export type OutputType = "plot" | "histogram" | "table" | "value" | "heatmap";

export type ParameterType = "number" | "text" | "select" | "checkbox" | "range";

export interface PluginParameterOption {
  value: string | number;
  label: string;
}

export interface PluginParameter {
  id: string;
  label: string;
  type: ParameterType;
  default?: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: PluginParameterOption[];
  required?: boolean;
}

export interface PluginOutput {
  id: string;
  label: string;
  type: OutputType;
}
export interface PluginConfig {
  parameters: PluginParameter[];
  outputs: PluginOutput[];
  requiredPackages?: string[];
}

export interface Plugin {
  id: string;
  user_id: string;
  name: string;
  description: string;
  config: PluginConfig;
  version: string;
  script: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}
export interface PluginResult {
  id: string;
  plugin_id: string;
  workspace_id: string;
  measurement_id: string;
  parameters: Record<string, unknown>;
  results: Record<string, any>;
  created_at: string;
  updated_at: string;
}
export interface PlotData {
  x: number[];
  y: number[];
  xlabel?: string;
  ylabel?: string;
  title?: string;
  type?: "line" | "scatter" | "bar";
  series?: Array<{ x: number[]; y: number[]; label?: string }>;
}

export interface HistogramData {
  bins: number[];
  counts: number[];
  xlabel?: string;
  ylabel?: string;
  title?: string;
  colorScale?: "viridis" | "plasma" | "inferno" | "magma" | "grayscale";
}

export interface CreatePluginRequest {
  name: string;
  description?: string;
  config: PluginConfig;
  script: string;
}

export interface UpdatePluginRequest {
  name?: string;
  description?: string;
  config?: PluginConfig;
  script?: string;
  enabled?: boolean;
}

export interface PluginResponse {
  success: boolean;
  plugin?: Plugin;
  message?: string;
}

export interface PluginsResponse {
  success: boolean;
  plugins?: Plugin[];
  message?: string;
}

export interface SavePluginResultRequest {
  workspace_id: string;
  plugin_id: string;
  measurement_id: string;
  parameters: Record<string, unknown>;
  results: Record<string, any>;
}

export interface PluginResultResponse {
  success: boolean;
  result: PluginResult;
  message?: string;
}

export interface PluginManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface PluginEditorProps {
  plugin?: Plugin;
  onSave: (plugin: CreatePluginRequest) => Promise<void>;
  onCancel: () => void;
}

export interface PluginTabProps {
  plugin: Plugin;
  measurement_data: MeasurementData;
  workspace_id: string;
}

export interface ParameterFormProps {
  parameters: PluginParameter[];
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
}

export interface ResultsRendererProps {
  outputs: PluginOutput[];
  results: Record<string, unknown>;
}

export interface MeasurementData {
  micortimes: number[];
  abstimes: number[];
  channel: number;
  metaData: Record<string, unknown>;
}

export interface PluginExecutionState {
  status: "idle" | "loading" | "running" | "success" | "error";
  errorMessage?: string;
  results?: Record<string, unknown>;
}

export const OUTPUT_TYPE_OPTIONS: Array<{
  value: OutputType;
  label: string;
  description: string;
}> = [
  { value: "plot", label: "Plot", description: "Line or scatter chart" },
  {
    value: "histogram",
    label: "Histogram",
    description: "Bar chart for distributions",
  },
  {
    value: "table",
    label: "Table",
    description: "Data table with rows and columns",
  },
  { value: "value", label: "Value", description: "Single number or text" },
  {
    value: "heatmap",
    label: "Heatmap",
    description: "2D color map for raster or intensity data",
  },
];

export const PARAMETER_TYPE_OPTIONS: Array<{
  value: ParameterType;
  label: string;
}> = [
  { value: "number", label: "Number" },
  { value: "text", label: "Text" },
  { value: "select", label: "Dropdown Select" },
  { value: "checkbox", label: "Checkbox" },
  { value: "range", label: "Range Slider" },
];

export interface HeatmapData {
  values: number[][];
  xLabels?: string[];
  yLabels?: string[];
  xlabel?: string;
  ylabel?: string;
  title?: string;
  colorScale?: "viridis" | "plasma" | "inferno" | "magma" | "grayscale";
}

export interface TableData {
  columns: string[];
  rows: Array<Array<string | number>>;
  title?: string;
}
export type ValueData = string | number | boolean;