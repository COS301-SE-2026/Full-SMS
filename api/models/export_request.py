from pydantic import BaseModel
from api.legacy.io.exporters import ExportFormat

class ExportRequest(BaseModel):
    measurement_ids: list[int]
    channel: int = 1
    export_levels: bool = False
    export_groups: bool= False
    export_intensity: bool = False
    format: ExportFormat = ExportFormat.CSV
    use_roi: bool = False