from pydantic import BaseModel, Field
from typing import Optional

class CommentCreate(BaseModel):
    upload_id: str = Field(..., min_length=1)