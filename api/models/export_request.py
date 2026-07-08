from pydantic import BaseModel
from legacy.io.exporters import ExportFormat

class ExportRequest(BaseModel):
    mesurement_ids: list[int]
    Format: ExportFormat = ExportFormat.CSV