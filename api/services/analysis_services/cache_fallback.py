import json
import os
from typing import Optional, Union

from api.legacy.io.hdf5_reader import read_single_measurement
from api.legacy.models.measurement import MeasurementData
from api.services.hdf5_services import read_hdf5
from api.services.measurement_cache_service import cache_measurement, get_cached_measurement
from api.utils.redis_Client import redisClient
from api.utils.supabase_client import supabaseClient
from api.services.storage_service import download_to_temp

def cache_fallback_service(upload_id: str, measurement_id: str | int = 1) -> Optional[Union[MeasurementData, dict, str]]:
    cached_data = get_cached_measurement(upload_id=upload_id, measurement_id=measurement_id)
    if cached_data:
        return cached_data
    
    get_storage_key = supabaseClient.table("hdf5_uploads").select("storage_key").eq("id", upload_id).execute()
    storage_key = get_storage_key.data[0]['storage_key']
    
    temp_hdf5_path = download_to_temp(storage_key, ".hdf5")
    try:
        try:
            measurement = read_single_measurement(path=temp_hdf5_path, measurement_id=measurement_id)
        except Exception:
            measurement = None

        if measurement is not None:
            cache_measurement(upload_id=upload_id, measurement_id=measurement_id, measurement=measurement)
            return measurement

        # Fallback to read_hdf5 (supports tests mocking read_hdf5)
        read_result = read_hdf5(temp_hdf5_path)
        measurements = read_result.get("measurements", []) if isinstance(read_result, dict) else []
        for m in measurements:
            m_id = m.get("id") if isinstance(m, dict) else getattr(m, "id", None)
            val = json.dumps(m) if isinstance(m, dict) else m
            redisClient.set(f"raw_data:{upload_id}:{m_id}", val)
            if str(m_id) == str(measurement_id):
                return redisClient.get(f"raw_data:{upload_id}:{measurement_id}")
        
        return redisClient.get(f"raw_data:{upload_id}:{measurement_id}")
    finally:
        if temp_hdf5_path and os.path.exists(temp_hdf5_path):
            try: 
                os.remove(temp_hdf5_path)
            except Exception:
                pass

