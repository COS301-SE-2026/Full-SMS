from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class Lifetime_Req(BaseModel):
    upload_id: str
    measurement_id: str
    bin_size: float
    start_end_gate: Optional[list[float]] = None
    fitting_model: str = "mono_exponential"

class Lifetime_Res(BaseModel):
    time_bins: List[float] #time (ms)
    histogram: List[int] #counts/bin
    fit_curve: Optional[List[float]] = None
    fit_params: Optional[Dict[str, Any]] = None