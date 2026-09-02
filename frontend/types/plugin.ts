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
  marketplace_status: "pending_review" | "approved" | "rejected" | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_feedback: string | null
  source_plugin_id: string | null;
  available_version: string | null;
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
  version: string;
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

export interface PluginEditorProps {
  plugin?: Plugin;
  onSave: (plugin: CreatePluginRequest) => Promise<void>;
  onCancel: () => void;
}

export interface PluginTabProps {
  plugin: Plugin;
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

export interface PluginExecutionState {
  status: "idle" | "loading" | "running" | "success" | "error";
  error?: string;
  results?: Record<string, unknown>;
  isPreviousResult?: boolean;
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

export interface ExecutePluginRequest {
  parameters: Record<string, unknown>;
  workspace_id?: string;
  measurement_id?: string;
  upload_id?: string;
}

export interface ExecutePluginResponse {
  success: boolean;
  execution_id?: string;
  results?: Record<string, unknown>;
  execution_time?: number;
  message?: string;
  error?: string;
}
