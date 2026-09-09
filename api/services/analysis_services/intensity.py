from api.services.analysis_services.cache_fallback import cache_fallback_service
from api.services.hdf5_services import read_hdf5
from api.services.measurement_cache_service import get_cached_measurement
from api.services.storage_service import download_to_temp
from api.utils.redis_Client import redisClient
from api.utils.supabase_client import supabaseClient
from api.models.analysis_models import IntensityReq, IntensityRes
import json
import numpy as np 
from api.legacy.analysis.histograms import bin_photons, compute_intensity_cps

import json

def intensity_analysis(payload: IntensityReq) -> IntensityRes:
    """
    Intensity analysis Service.

    Returns:
        response (IntensityRes): Object containing time_bins, counts and intesity_cps
    """
    upload_id = payload.upload_id

    measurement_id = payload.measurement_id

    cached_measurement = get_cached_measurement(upload_id=upload_id, measurement_id=measurement_id)
    if not cached_measurement:
        cached_measurement = cache_fallback_service(upload_id=upload_id, measurement_id=measurement_id)

    if isinstance(cached_measurement, str):
        cached_measurement = json.loads(cached_measurement)

    if isinstance(cached_measurement, dict):
        abstimes = np.array(cached_measurement["channel1"]["abstimes"], dtype=np.float64)
    else:
        abstimes = cached_measurement.channel1.abstimes

    times_ms, counts = bin_photons(abstimes=abstimes, bin_size_ms=payload.bin_size_ms)
    intensity_cps = compute_intensity_cps(counts=counts, bin_size_ms=payload.bin_size_ms)

    res_data = {
        "time_bins": times_ms.tolist(),
        "counts": counts.tolist(),
        "intensity_cps": intensity_cps.tolist()
    }

    response: IntensityRes = IntensityRes(**res_data)
    return response