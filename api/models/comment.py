from pydantic import BaseModel, Field
from typing import Optional

class CommentCreate(BaseModel):
    upload_id: str = Field(..., min_length=1)
    measurement_id: Optional[str] = None
    tab: str = Field(..., pattern="^(intensity|lifetime|correlation|grouping|raster|spectra)$")