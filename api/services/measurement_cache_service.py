
import pickle
from typing import Optional

from api.legacy.models.measurement import MeasurementData
from api.utils.redis_Client import redisClient

def build_cache_key(upload_id: str, measurement_id: str | int) -> str:
    return f"meas_bin:{upload_id}:{measurement_id}"

def cache_measurement(upload_id: str, measurement_id: str, measurement: MeasurementData):
    """Place individual measurements in Redis cache"""
    
    cache_key = build_cache_key(upload_id=upload_id, measurement_id=measurement_id)
    ttl = 86400 * 2 
    try: 
        byte_data = pickle.dumps(measurement, protocol=5)
        redisClient.setex(cache_key, ttl, byte_data)
    except Exception as e:
        print(f"There was an error saving measurent to cache: {e}")
        
def get_cached_measurement(upload_id: str, measurement_id: str | int) -> Optional[MeasurementData]:
    """Retrieve Measurement data from cache"""
    
    cache_key = build_cache_key(upload_id=upload_id, measurement_id=measurement_id)
    
    try:
        byte_data= redisClient.get(cache_key)
        if not byte_data:
            return None
        return pickle.loads(byte_data)
    except Exception as e:
        print(f"There was an error getting measurement-{measurement_id} from cache: {e}")
        return None