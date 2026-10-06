from pydantic import BaseModel, Field
from typing import Optional

class NotificationCreate(BaseModel):
    recepient_id: str = Field(..., min_length=1)
    type: str = Field(..., pattern="^(comment|invite)$")
    message: str = Field(..., min_length=1, max_length=500)
    