export type DataOutputType =
  | "dataset"
  | "array"
  | "timeseries"
  | "fitresult"
  | "dataframe";

export type PresentationOutputType =
  | "plot"
  | "histogram"
  | "table"
  | "value"
  | "heatmap";

export type OutputType = PresentationOutputType | DataOutputType;

export type ChainParameterType = "plugin_output";

export type StandardParameterType =
  | "number"
  | "text"
  | "select"
  | "checkbox"
  | "range";
export type ParameterType = StandardParameterType | ChainParameterType;

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
  acceptedOutputTypes?: DataOutputType[];
  acceptedPluginIds?: string[];
}

export interface OutputSchema {
  dtype?: "float64" | "int64" | "float32" | "int32" | "bool" | "string";
  shape?: number[];
  unit?: string;
  fields?: {
    name: string;
    type: "array" | "value" | "metadata";
    dtype?: string;
    unit?: string;
    description?: string;
  }[];
  timeUnit?: "ns" | "us" | "ms" | "s";
  parameters?: string[];
  columns?: {
    name: string;
    dtype: string;
    description?: string;
  }[];
}

export interface PluginOutput {
  id: string;
  label: string;
  type: OutputType;
  schema?: OutputSchema;
  chainable?: boolean;
  exportable?: boolean;
  description?: string;
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
  review_feedback: string | null;
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

export interface MeasurementData {
  microtimes: number[];
  abstimes: number[];
  channel?: number;
  metadata?: Record<string, unknown>;
}

export interface PluginTabProps {
  plugin: Plugin;
  measurementData?: MeasurementData;
  workspaceId?: string;
}

export interface ParameterFormProps {
  parameters: PluginParameter[];
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  availableOutputs?: PluginOutputReference[];
}

export interface ResultsRendererProps {
  outputs: PluginOutput[];
  results: Record<string, unknown>;
  executionId?: string;
  onExport?: (outputId: string, format: ExportFormat) => void;
}

export interface PluginExecutionState {
  status: "idle" | "loading" | "running" | "success" | "error";
  error?: string;
  results?: Record<string, unknown>;
  isPreviousResult?: boolean;
  executionId?: string;
}

export const OUTPUT_TYPE_OPTIONS: Array<{
  value: OutputType;
  label: string;
  description: string;
  category: "presentation" | "data";
}> = [
  {
    value: "plot",
    label: "Plot",
    description: "Line or scatter chart",
    category: "presentation",
  },
  {
    value: "histogram",
    label: "Histogram",
    description: "Bar chart for distributions",
    category: "presentation",
  },
  {
    value: "table",
    label: "Table",
    description: "Data table with rows and columns",
    category: "presentation",
  },
  {
    value: "value",
    label: "Value",
    description: "Single number or text",
    category: "presentation",
  },
  {
    value: "heatmap",
    label: "Heatmap",
    description: "2D color map for raster or intensity data",
    category: "presentation",
  },
  {
    value: "array",
    label: "Array",
    description: "1D numeric array (chainable)",
    category: "data",
  },
  {
    value: "dataset",
    label: "Dataset",
    description: "Structured data with multiple arrays (chainable)",
    category: "data",
  },
  {
    value: "timeseries",
    label: "Time Series",
    description: "Time-value pairs (chainable)",
    category: "data",
  },
  {
    value: "fitresult",
    label: "Fit Result",
    description: "Curve fitting results (chainable)",
    category: "data",
  },
  {
    value: "dataframe",
    label: "Dataframe",
    description: "Tabular data with typed columns (chainable)",
    category: "data",
  },
];

export const PARAMETER_TYPE_OPTIONS: Array<{
  value: ParameterType;
  label: string;
  description?: string;
}> = [
  { value: "number", label: "Number" },
  { value: "text", label: "Text" },
  { value: "select", label: "Dropdown Select" },
  { value: "checkbox", label: "Checkbox" },
  { value: "range", label: "Range Slider" },
  {
    value: "plugin_output",
    label: "Plugin Output",
    description: "Select output from another plugin",
  },
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
  chained_inputs?: {
    parameter_id: string;
    source_execution_id: string;
    source_output_id: string;
  }[];
}

export interface ExecutePluginResponse {
  success: boolean;
  execution_id?: string;
  results?: Record<string, unknown>;
  execution_time?: number;
  message?: string;
  error?: string;
  execution_time_ms?: number;
  result_id?: string;
}

export interface ArrayData {
  values: number[];
  dtype?: string;
  unit?: string;
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface Array2DData {
  values: number[][];
  shape: [number, number];
  dtype?: string;
  rowLabels?: string[];
  colLabels?: string[];
  metadata?: Record<string, unknown>;
}

export interface DatasetData {
  arrays: Record<
    string,
    {
      values: number[];
      dtype?: string;
      unit?: string;
      description?: string;
    }
  >;
  metadata: Record<string, unknown>;
  schema?: {
    version: string;
    description?: string;
    arrays: Record<
      string,
      {
        dtype: string;
        unit?: string;
        description?: string;
      }
    >;
  };
}

export interface TimeseriesData {
  time: number[];
  values: number[];
  timeUnit: "ns" | "us" | "ms" | "s";
  valueUnit?: string;
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface FitResultData {
  parameters: Record<string, number>;
  uncertainties?: Record<string, number>;
  covariance?: number[] | number[][];
  metrics: {
    chi_squared?: number;
    reduced_chi_squared?: number;
    r_squared?: number;
    rmse?: number;
    aic?: number;
    bic?: number;
  };
  fitted_curve?: {
    x: number[];
    y: number[];
  };
  residuals?: number[];
  model?: {
    name: string;
    equation?: string;
    description?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface DataframeData {
  columns: {
    name: string;
    dtype: "float64" | "int64" | "string" | "bool";
    values: (number | string | boolean)[];
  }[];
  index?: (number | string)[];
  metadata?: Record<string, unknown>;
}

export interface PluginExecution {
  id: string;
  plugin_id: string;
  workspace_id: string;
  measurement_id: string;
  status: "pending" | "running" | "success" | "error";
  parameters: Record<string, unknown>;
  results?: Record<string, unknown>;
  error_message?: string;
  execution_time_ms?: number;
  created_at: string;
  completed_at?: string;
}

export interface LatestExecutionResponse {
  success: boolean;
  execution?: PluginExecution;
  has_previous_result: boolean;
}

export type ExportFormat =
  | "csv"
  | "json"
  | "excel"
  | "hdf5"
  | "png"
  | "pdf"
  | "svg";

export interface ExportRequest {
  execution_id: string;
  output_id: string;
  format: ExportFormat;
}

export interface ExportAllRequest {
  execution_id: string;
  format: ExportFormat;
}

export interface PluginOutputReference {
  plugin_id: string;
  plugin_name: string;
  execution_id: string;
  output_id: string;
  output_label: string;
  output_type: DataOutputType;
  executed_at: string;
  workspace_id: string;
  measurement_id: string;
}

export interface AvailableOutputsResponse {
  success: boolean;
  outputs: PluginOutputReference[];
  message?: string;
}

export function isDataOutputType(type: OutputType): type is DataOutputType {
  return ["dataset", "array", "timeseries", "fitresult", "dataframe"].includes(
    type,
  );
}

export function isPresentationOutputType(
  type: OutputType,
): type is PresentationOutputType {
  return ["plot", "histogram", "table", "value", "heatmap"].includes(type);
}

export function getDefaultChainable(type: OutputType): boolean {
  return isDataOutputType(type);
}

export function getAvailableExportFormats(type: OutputType): ExportFormat[] {
  switch (type) {
    case "plot":
    case "histogram":
    case "heatmap":
      return ["json"];
    case "table":
    case "dataframe":
      return ["csv", "json", "excel"];
    case "value":
      return ["json"];
    case "array":
    case "timeseries":
      return ["csv", "json", "hdf5"];
    case "dataset":
    case "fitresult":
      return ["json", "hdf5"];
    default:
      return ["json"];
  }
}
