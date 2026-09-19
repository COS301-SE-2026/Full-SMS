from pydantic import BaseModel, Field


class HistoryEntryCreate(BaseModel):
    upload_id: str 
    measurement_id: str | None = None
    tab: str
    parameter: str 
    old_value: object = None
    new_value: object