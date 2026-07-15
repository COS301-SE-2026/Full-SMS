from api.utils.redis_Client import redisClient
from api.utils.supabase_client import supabaseClient
from api.models.analysis_models import RasterScanReq

def get_raster_scan_data(payload: RasterScanReq):

    upload_id = payload.upload_id
    measurement_id = payload.measurement_id

    cached_data = redisClient.get(f"raw_data:{upload_id}:{measurement_id}")
    if not cached_data:
        raise ValueError("Raw data not in cache.")

    raw_data = json.loads(cached_data)
    raster_scan = raw_data["raster_scan"]
    raster_scan_coord = raw_data["raster_scan_coord"]

    return {
        "raster_scan": raster_scan,
        "raster_scan_coord": raster_scan_coord
    }

    