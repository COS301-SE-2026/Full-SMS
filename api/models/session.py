from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class SessionCreate(BaseModel):
    name: str
    dataset_ref: Optional[str] = None
    parameters: Optional[dict] = None
    results: Optional[dict] = None
    dataset_name: Optional[str] = None


class SessionResponse(SessionCreate):
    id: str
    user_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)