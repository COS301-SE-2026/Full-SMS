from pydantic import BaseModel, Field
from typing import Optional

class CommentCreate(BaseModel):
    upload_id: str = Field(..., min_length=1)
    measurement_id: Optional[str] = None
    tab: str = Field(..., pattern="^(intensity|lifetime|correlation|grouping|raster|spectra)$")
    content: str = Field(..., min_length=1, max_length=1000)
    anchor_x:Optional[float] = None
    anchor_y: Optional[float] = None