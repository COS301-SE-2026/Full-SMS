import json
from pathlib import Path
from api.models.export_request import ExportRequest
from api.legacy.io import exporters
from api.utils.redis_Client import redisClient

def _get_measurement_data(upload_id:str, measurement_id: str, user_id: str) -> dict :
    cashedData = redisClient.get(f"raw_data:{upload_id}:{measurement_id}")
    if cashedData:
        return json.loads(cashedData)
    raise NotImplementedError("to be wired")

def export_data(request: ExportRequest) -> Path:
    for measurement_id in request.measurement_ids:
        data = _get_measurement_data(measurement_id, request.channel)
        # will call exporters.exporters_intensitytrace etc once data exists
        raise NotImplementedError("to be wired")