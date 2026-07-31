from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Tuple
import numpy as np
from api.legacy.analysis.lifetime import FitSettings, StartpointMode
from api.legacy.models.level import LevelData
from api.legacy.models import ClusteringResult
from numpy.typing import NDArray
import numpy as np

## request and response models for lifetime analysis
class LifetimeRes(BaseModel):
    times: list[float]
    counts: list[float]  
    tau: list[float]
    tau_std: list[float]
    amplitude: list[float]
    amplitude_std: list[float]
    shift: float
    shift_std: float
    chi_squared: float
    durbin_watson: float
    dw_bounds: Optional[list[float]] = None
    residuals: list[float]
    fitted_curve: list[float]
    fit_start_index: int
    fit_end_index: int
    background: float
    num_exponentials: int
    average_lifetime: float
    fitted_irf_fwhm: Optional[float] = None
    fitted_irf_fwhm_std: Optional[float] = None

class LifetimeReq(BaseModel):
    upload_id: str
    measurement_id: str
    times: list[float]                # Changed from NDArray
    counts: list[int]                 # Changed from NDArray
    channelwidth: Optional[float] = None
    irf: Optional[list[float]] = None # Changed from NDArray
    num_exponentials: int = 1
    tau_init: Optional[float | list[float]] = None
    tau_bounds: Optional[Tuple[float, float]] = None
    amp_init: Optional[list[float]] = None
    amp_bounds: Optional[Tuple[float, float]] = None
    shift_init: float = 0.0
    shift_bounds: Optional[Tuple[float, float]] = None
    start: Optional[int] = None
    end: Optional[int] = None
    autostart: StartpointMode = StartpointMode.MANUAL 
    autoend: bool = False
    background: Optional[float] = None
    irf_background: Optional[float] = None
    settings: Optional[FitSettings] = None
    fit_irf_fwhm: bool = False
    irf_fwhm_init: Optional[float] = None
    irf_fwhm_bounds: Optional[Tuple[float, float]] = None

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
