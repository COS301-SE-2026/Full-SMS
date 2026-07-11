import gzip
import json
import numpy as np
from pathlib import Path
from api.models.export_request import ExportRequest
from api.legacy.io import exporters
from api.utils.redis_Client import redisClient
from api.services.storage_service import build_storage_key, download_to_temp

def _get_measurement_data(upload_id:str, measurement_id: str, user_id: str) -> dict :
    cashedData = redisClient.get(f"raw_data:{upload_id}:{measurement_id}")
    if cashedData:
        return json.loads(cashedData)
    
    storage_key = build_storage_key(user_id, upload_id, "measurements.json.gz")
    temporaryPath = download_to_temp(storage_key, file_extension=".json.gz")
    with gzip.open(temporaryPath, "rt", encoding="utf-8") as f:
        measurements = json.load(f)
        for measurement in measurements:
            if measurement.get("id") == measurement_id:
                return measurement
        raise ValueError(f"measurement {measurement_id} not found in backup")



def export_data(request: ExportRequest, user_id: str) -> Path:
    for measurement_id in request.measurement_ids:
        data = _get_measurement_data(request.upload_id, measurement_id, user_id)
        if request.export_intensity:
            channel_key = f"channel{request.channel}"
            abtimes=np.array(data[channel_key]["abtimes"], dtype=np.uint64)
        # will call exporters.exporters_intensitytrace etc where a real output path will be built
        raise NotImplementedError("to be wired")