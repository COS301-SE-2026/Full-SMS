from typing import Optional
from pydantic import BaseModel, Field


class ApprovePluginRequest(BaseModel):
    feedback: Optional[str] = Field(None, min_length=10)


class RejectPluginRequest(BaseModel):
    feedback: Optional[str] = Field(None, min_length=10)
