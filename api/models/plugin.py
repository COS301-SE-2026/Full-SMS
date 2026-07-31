from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict


class PluginToggle(BaseModel):
    enabled: bool


class PluginOutput(BaseModel):
    id: str = Field(..., min_length=1, max_length=100)
    label: str = Field(..., min_length=1, max_length=255)
    type: str = Field(..., pattern="^(plot|histogram|table|value|heatmap)$")


class PluginParameter(BaseModel):
    id: str = Field(..., min_length=1, max_length=100)
    label: str = Field(..., min_length=1, max_length=255)
    type: str = Field(..., pattern="^(number|text|select|checkbox|range)$")
    default: Optional[Any] = None
    min: Optional[float] = None
    max: Optional[float] = None
    step: Optional[float] = None
    options: Optional[List[str]] = None


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


class PluginExecute(BaseModel):
    workspace_id: Optional[str] = None
    measurement_id: Optional[str] = None
    parameters: Dict[str, Any] = None
    measurement_data: Optional[MeasurementData] = None
    upload_id: Optional[str] = None

class PluginValidate(BaseModel):
    script: str = Field(..., min_length=1)
