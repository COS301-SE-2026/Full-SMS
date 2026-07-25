import gzip
import json
import tempfile
import os
import zipfile
import numpy as np
from pathlib import Path
from api.models.export_request import ExportRequest
from api.legacy.io import exporters
from api.utils.redis_Client import redisClient
from api.services.storage_service import build_storage_key, download_to_temp
from api.services.session_service import get_sessions


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


def _get_Saved_Analysis(upload_id: str, measurement_id:str, user_id:str) -> dict:
    sessions = get_sessions(user_id)
    match = [ s for s in sessions if s.get("dataset_ref") == upload_id]
    if not match:
        raise NotImplementedError("NO saved session for this upload. Run and save analysis first.")

    latest = match[0]
    results = latest.get("results", {})
    levels = results.get("levels")
    groups = results.get("groups")

    if levels and levels.get("measurement_id") != measurement_id:
        raise NotImplementedError("Saved session does not match this measurement.")
    return {"levels": levels, "groups":groups}


def export_data(request: ExportRequest, user_id: str) -> Path:
    outputPaths =[]
    for selection in request.selections:
        measurement_id = selection.measurement_id
        channel = selection.channel
        data = _get_measurement_data(request.upload_id, measurement_id, user_id)
        
        if request.export_intensity:
            channel_key = f"channel{channel}"
            abstimes=np.array(data[channel_key]["abstimes"], dtype=np.uint64)

            fd, temp_path = tempfile.mkstemp()
            os.close(fd)
            output_path=exporters.export_intensity_trace(
                abstimes=abstimes,
                output_path=Path(temp_path),
                fmt=request.format,
                bin_size_ms = request.bin_size_ms,
                measurement_name=data.get("name", ""),
            
            )
            measurement_name = data.get("name", f"measurement_{measurement_id}").replace(" ", "_")
            normalName = f"{measurement_name}_intensity{output_path.suffix}"
            
        

            outputPaths.append((output_path, normalName))
        else:
            raise NotImplementedError("levels/groups export to be wired")
        
    if len(outputPaths) == 1 :
        path, normalName = outputPaths[0]
        return path, normalName
        
    zip_filedescr,zip_path = tempfile.mkstemp(suffix=".zip")
    os.close(zip_filedescr)
    with zipfile.ZipFile(zip_path, "w") as zf:
        for path, normalName in outputPaths:
            zf.write(path,arcname=normalName)

    normalName_zip = f"export_{request.upload_id}.zip"
    return Path(zip_path), normalName_zip
