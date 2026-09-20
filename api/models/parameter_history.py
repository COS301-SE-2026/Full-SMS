from pydantic import BaseModel, Field
from typing import Any, Optional

class HistoryEntryCreate(BaseModel):
    upload_id: str = Field(..., min_length=1)
    measurement_id: Optional[str] = None
    tab: str = Field(..., pattern="^(intensity|lifetime|correlation|grouping|raster|spectra)$")
    parameter: str  = Field(..., min_length=1, max_length=100)
    old_value: Any = None
    new_value: Any = Field(...)