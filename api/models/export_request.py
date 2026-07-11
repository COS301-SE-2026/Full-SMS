from pydantic import BaseModel
from api.legacy.io.exporters import ExportFormat

class ExportRequest(BaseModel):
    upload_id: str
    measurement_ids: list[str]
    channel: int = 1
    export_levels: bool = False
    export_groups: bool= False
    export_intensity: bool = False
    format: ExportFormat = ExportFormat.CSV
    use_roi: bool = False