from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

#create class for the data that you are modelling which inherits the basemodel class
#this is what the frontend sends to the backend when saving a session
class SessionCreate(BaseModel):
    #fields
    name: str
    dataset_ref: Optional[str] = None
    parameters: Optional[dict] = None
    results: Optional[dict] = None

#this is what the backend sends to the frontend when fetching a session
class SessionResponse(SessionCreate):
    id: str
    user_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)