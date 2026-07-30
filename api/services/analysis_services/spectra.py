from api.services.analysis_services.cache_fallback import cache_fallback_service
from api.utils.redis_Client import redisClient
from api.models.analysis_models import RasterScanReq
import json
import numpy as np
from numpy.typing import NDArray

def get_spectra_data(payload: RasterScanReq):
    upload_id = payload.upload_id
    measurement_id = payload.measurement_id

    cached_data = redisClient.get(f"raw_data:{upload_id}:{measurement_id}")
    if not cached_data:
       cached_data = cache_fallback_service(upload_id)

    raw_data = json.loads(cached_data)
    spectra = raw_data["spectra"]
    data = np.array(spectra["data"])
    series_times = np.array(spectra["series_times"])
    wavelegths = np.array(spectra["wavelengths"])
    exposure_time= float(spectra["exposure_time"])

    data_transposed = data.T

    rows = data_transposed.shape[0]
    cols = data_transposed.shape[1]

    t_min = float(np.min(series_times))
    t_max = float(np.max(series_times))
    wl_min = float(np.min(wavelegths))
    wl_max = float(np.max(wavelegths))

    scale_min = float(np.min(data))
    scale_max = float(np.max(data))

    # Handle case where all values are the same
    if scale_max <= scale_min:
        scale_max = scale_min + 1.0

    # Flatten the data in row-major order for heat_series
    z_matrix = data_transposed.tolist()

    return {
        "z": z_matrix,
        "rows": rows ,
        "cols": cols,
        "bounds_min" :(t_min, wl_min),
        "bounds_max" :(t_max, wl_max),
        "scale_min" :scale_min,
        "scale_max" :scale_max,
        "exposure_time" : exposure_time

    }
