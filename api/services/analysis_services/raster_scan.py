from api.services.analysis_services.cache_fallback import cache_fallback_service
from api.services.measurement_cache_service import get_cached_measurement
from api.models.analysis_models import RasterScanReq

def get_raster_scan_data(payload: RasterScanReq):
    upload_id = payload.upload_id
    measurement_id = payload.measurement_id

    cached_measurement = get_cached_measurement(upload_id, measurement_id)
    if not cached_measurement:
        cached_measurement = cache_fallback_service(upload_id=upload_id, measurement_id=measurement_id)

    raster_scan = cached_measurement.raster_scan
    if hasattr(raster_scan, "data"):
        raster_dict = {
                "data": raster_scan.data.tolist(),
                "x_start": raster_scan.x_start,
                "y_start": raster_scan.y_start,
                "scan_range": raster_scan.scan_range,
                "pixels_per_line": raster_scan.pixels_per_line,
                "integration_time": raster_scan.integration_time,
            }
    elif isinstance(raster_scan, dict):
        raster_dict = raster_scan

    raster_scan_coord = cached_measurement.raster_scan_coord
    if isinstance(raster_scan_coord, tuple):
        raster_scan_coord = list(raster_scan_coord)

    return {
        "raster_scan": raster_dict,
        "raster_scan_coord": raster_scan_coord
    }

    