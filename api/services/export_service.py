from pathlib import Path
from models.export_request import ExportRequest
from legacy.io import exporters

def _measurement_data(measurement_id: int, channel: int) :
    #to add real data fetch after Carlos confirms how to get full channel data
    raise NotImplementedError("to be wired")

def export_data(request: ExportRequest) -> Path:
    for measurement_id in request.measurement_ids:
        data = _get_measurement_data(measurement_id, request.channel)
        # will call exporters.exporters_intensitytrace etc once data exists
        raise NotImplementedError("to be wired")