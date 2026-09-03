
import json
import pickle
from typing import Optional, Union

from api.legacy.models.measurement import MeasurementData
from api.utils.redis_Client import redisClient

def build_cache_key(upload_id: str, measurement_id: str | int) -> str:
    return f"raw_data:{upload_id}:{measurement_id}"

def cache_measurement(upload_id: str, measurement_id: str | int, measurement: MeasurementData):
    """Place individual measurements in Redis cache in binary format."""
    cache_key = build_cache_key(upload_id=upload_id, measurement_id=measurement_id)
    try: 
        byte_data = pickle.dumps(measurement, protocol=5)
        redisClient.set(cache_key, byte_data)
    except Exception as e:
        print(f"There was an error saving measurement to cache: {e}")
        
def get_cached_measurement(upload_id: str, measurement_id: str | int) -> Optional[Union[MeasurementData, dict]]:
    """Retrieve Measurement data from cache, supporting both binary MeasurementData and legacy dict."""
    cache_key = build_cache_key(upload_id=upload_id, measurement_id=measurement_id)
    try:
        raw_data = redisClient.get(cache_key)
        if not raw_data:
            return None
        if isinstance(raw_data, (bytes, bytearray)):
            try:
                return pickle.loads(raw_data)
            except Exception:
                return json.loads(raw_data.decode("utf-8"))
        elif isinstance(raw_data, str):
            return json.loads(raw_data)
        elif isinstance(raw_data, (dict, MeasurementData)):
            return raw_data
        return None
    except Exception as e:
        print(f"There was an error getting measurement-{measurement_id} from cache: {e}")
        return None