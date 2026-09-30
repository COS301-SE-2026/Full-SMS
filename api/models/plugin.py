from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from enum import Enum


class PluginToggle(BaseModel):
    enabled: bool


class OutputType(str, Enum):
    PLOT = "plot"
    HISTOGRAM = "histogram"
    TABLE = "table"
    VALUE = "value"
    HEATMAP = "heatmap"
    DATASET = "dataset"
    ARRAY = "array"
    TIMESERIES = "timeseries"
    FITRESULT = "fitresult"
    DATAFRAME = "dataframe"


class ParameterType(str, Enum):
    NUMBER = "number"
    TEXT = "text"
    SELECT = "select"
    CHECKBOX = "checkbox"
    RANGE = "range"
    PLUGIN_OUTPUT = "plugin_output"


class ExportFormat(str, Enum):
    CSV = "csv"
    JSON = "json"
    EXCEL = "excel"
    HDF5 = "hdf5"
    PNG = "png"
    PDF = "pdf"
    SVG = "svg"


class OutputSchema(BaseModel):
    dtype: Optional[str] = None
    shape: Optional[List[int]] = None
    unit: Optional[str] = None
    fields: Optional[List[Dict[str, Any]]] = None
    timeUnit: Optional[str] = None
    parameters: Optional[List[str]] = None
    columns: Optional[List[Dict[str, Any]]] = None


class PluginParameterOption(BaseModel):
    value: Any
    label: str


class PluginOutput(BaseModel):
    id: str = Field(..., min_length=1, max_length=100)
    label: str = Field(..., min_length=1, max_length=255)
    type: str = Field(...)
    schema_: Optional[OutputSchema] = Field(None, alias="schema")
    chainable: Optional[bool] = None
    exportable: Optional[bool] = True
    description: Optional[str] = None

    class Config:
        populate_by_name = True


class PluginParameter(BaseModel):
    id: str = Field(..., min_length=1, max_length=100)
    label: str = Field(..., min_length=1, max_length=255)
    type: str = Field(...)
    default: Optional[Any] = None
    min: Optional[float] = None
    max: Optional[float] = None
    step: Optional[float] = None
    options: Optional[List[PluginParameterOption]] = None
    required: Optional[bool] = False
    acceptedOutputTypes: Optional[List[str]] = None
    acceptedPluginIds: Optional[List[str]] = None


class PluginConfig(BaseModel):
    parameters: List[PluginParameter] = Field(default_factory=list)
    outputs: List[PluginOutput] = Field(..., min_length=1)
    requiredPackages: List[str] = Field(default_factory=list)


class PluginUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=1, max_length=1000)
    version: Optional[str] = Field(None, max_length=50)
    config: Optional[PluginConfig] = None
    script: Optional[str] = Field(None, min_length=1)


class PluginCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    version: str = Field(default="1.0.0", max_length=50)
    config: PluginConfig
    script: str = Field(..., min_length=1)


class MeasurementData(BaseModel):
    microtimes: List[float]
    abstimes: List[float]
    channel: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class ChainedInput(BaseModel):
    parameter_id: str
    source_execution_id: str
    source_output_id: str


class PluginExecute(BaseModel):
    workspace_id: Optional[str] = None
    measurement_id: Optional[str] = None
    parameters: Dict[str, Any] = None
    measurement_data: Optional[MeasurementData] = None
    upload_id: Optional[str] = None
    chained_inputs: Optional[List[ChainedInput]] = None


class PluginValidate(BaseModel):
    script: str = Field(..., min_length=1)


class PluginExportRequest(BaseModel):
    execution_id: str
    output_id: str
    format: ExportFormat


class PluginExportAllRequest(BaseModel):
    execution_id: str
    format: ExportFormat


class PluginOutputReference(BaseModel):
    plugin_id: str
    plugin_name: str
    execution_id: str
    output_id: str
    output_label: str
    output_type: str
    executed_at: str
    workspace_id: str
    measurement_id: str
