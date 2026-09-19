from pydantic import BaseModel, Field


class HistoryEntryCreate(BaseModel):
    upload_id: str = Field(..., min_length=1)
    measurement_id: str | None = None
    tab: str = Field(..., pattern="^(intensity|lifetime|correlation|grouping|raster|spectra)$")
    parameter: str  = Field(..., min_length=1, max_length=100)
    old_value: object = None
    new_value: object