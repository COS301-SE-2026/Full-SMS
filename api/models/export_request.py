from pydantic import BaseModel
from api.legacy.io.exporters import ExportFormat
from api.legacy.io.plot_exporters import PlotFormat


class Selection(BaseModel):
    measurement_id: str
    channel: int =1

class ExportRequest(BaseModel):
    upload_id: str
    selections: list[Selection]
    export_levels: bool = False
    export_groups: bool= False
    export_intensity: bool = False
    export_fits: bool = False
    format: ExportFormat = ExportFormat.CSV
    bin_size_ms: float =10.0

    plot_format: PlotFormat = PlotFormat.PDF
    plot_dpi: int = 150
    plot_intensity: bool = False
    plotIntensity_levels: bool = False
    plotIntensity_groups: bool = False
    plot_bic: bool = False
    
    use_roi: bool = False