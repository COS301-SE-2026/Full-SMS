from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np
from api.legacy.models.level import LevelData
from api.legacy.models import ClusteringResult

## request and response models for lifetime analysis
class LifetimeReq(BaseModel):
    upload_id: str
    measurement_id: str
    bin_size: float
    start_end_gate: Optional[list[float]] = None
    fitting_model: str = "mono_exponential"

class LifetimeRes(BaseModel):
    time_bins: List[float]
    histogram: List[int] 
    fit_curve: Optional[List[float]] = None
    fit_params: Optional[Dict[str, Any]] = None

## request and response models for intensity analysis
class IntensityReq(BaseModel):
    upload_id: str
    measurement_id: str
    bin_size_ms: float

class IntensityRes(BaseModel):
    time_bins: List[float]       # X-axis ( time in milliseconds)
    counts: List[int]            # Y-axis (Raw photon counts per bin)
    intensity_cps: List[float]

## request and response for resolving levels on intensity analysis
class CpaReq(BaseModel):
    upload_id: str
    measurement_id: str
    confidence: int


## Clustering / Grouping

class ClusteringReq(BaseModel):
    levels: List[LevelData]
class RasterScanReq(BaseModel):
    upload_id: str
    measurement_id:str
