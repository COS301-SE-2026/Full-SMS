from pydantic import BaseModel
from legacy.io.exporters import ExportFormat

class ExportRequest(BaseModel):
    measurement_ids: list[int]
    format: ExportFormat = ExportFormat.CSV