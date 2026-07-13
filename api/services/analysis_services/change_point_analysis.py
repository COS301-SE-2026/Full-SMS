from api.legacy.analysis.change_point import find_change_points
from api.models.analysis_models import ( CpaReq)
from api.services.hdf5_services import read_hdf5
from api.services.storage_service import download_to_temp
from api.utils.redis_Client import redisClient
from api.utils.supabase_client import supabaseClient
import json
import numpy as np
from api.legacy.analysis.change_point import ChangePointResult


def resolve_current_measurement(payload: CpaReq) -> dict:
    upload_id = payload.upload_id

    measurement_id = payload.measurement_id

    cached_data = redisClient.get(f"raw_data:{upload_id}:{measurement_id}")

    if not cached_data:
        temp_hdf5_path = None
        storage_key=supabaseClient.table("hdf5_uploads").eq("id", upload_id).select("storage_key").execute()
        temp_hdf5_path = download_to_temp(storage_key, ".hdf5")

        read_result = read_hdf5(temp_hdf5_path)
        result_metadata: dict = read_result["metadata"]
        print(f"\n\nParsed metadata: {result_metadata}\n\n")
        result_measurements = read_result["measurements"] # returns a list of dicts!!

        #save data to cache before compressing and sending to supabase
        #
        for measurement_data in result_measurements:
            measurement_id= measurement_data.get("id")
            key= f"raw_data:{upload_id}:{measurement_id}"
            redisClient.set(key, json.dumps(measurement_data))
            
        cached_data = redisClient.get(f"raw_data:{upload_id}:{measurement_id}")
    

    raw_data = json.loads(cached_data)
    abstimes = np.array(raw_data["channel1"]["abstimes"], dtype=np.float64)
    confidence = payload.confidence/100

    result = find_change_points(abstimes=abstimes, confidence=confidence)

    response = {
        "measurement_id": measurement_id,
        "num_change_points": int(result.num_change_points),
        "change_point_indices": result.change_point_indices.tolist(),
        "confidence_regions": [
            (int(start), int(end)) for start, end in result.confidence_regions
        ],
        "levels": [
            {
                "start_index": int(l.start_index),
                "end_index": int(l.end_index),
                "start_time_ns": int(l.start_time_ns),
                "end_time_ns": int(l.end_time_ns),
                "num_photons": int(l.num_photons),
                "intensity_cps": float(l.intensity_cps),
                "group_id": int(l.group_id) if l.group_id is not None else None
            }
            for l in result.levels
        ]
    }
    return response

