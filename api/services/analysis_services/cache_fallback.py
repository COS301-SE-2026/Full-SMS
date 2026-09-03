import os
from typing import Optional

from api.legacy.io.hdf5_reader import read_single_measurement
from api.legacy.models.measurement import MeasurementData
from api.services.hdf5_services import read_hdf5
from api.services.measurement_cache_service import cache_measurement, get_cached_measurement
from api.utils.redis_Client import redisClient
from api.utils.supabase_client import supabaseClient
from api.services.storage_service import download_to_temp
import json

def cache_fallback_service(upload_id: str, measurement_id: str| int ) -> Optional[MeasurementData]:
    
    cached_data =  get_cached_measurement()
    if cached_data:
        return cached_data
    
    
    temp_hdf5_path = None
    get_storage_key = supabaseClient.table("hdf5_uploads").select("storage_key").eq("id", upload_id).execute()
    if not get_storage_key.data:
        raise ValueError("Upload record not found")
    storage_key = get_storage_key.data[0]['storage_key']
    
    temp_hdf5_path = download_to_temp(storage_key, ".hdf5")
    try:
        measurement = read_single_measurement(path=temp_hdf5_path, measurement_id=measurement_id)
        if measurement is None:
            raise ValueError("Measurement not found in upload")
        
        cache_measurement(upload_id=upload_id, measurement_id=measurement_id, measurement=measurement)
        return measurement
    
    finally:
        if temp_hdf5_path and os.path.exists(temp_hdf5_path):
            try: 
                os.remove(temp_hdf5_path)
            except Exception:
                pass

