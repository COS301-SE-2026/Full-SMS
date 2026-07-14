from api.services.analysis_services.cache_fallback import cache_fallback_service
from api.services.hdf5_services import read_hdf5
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

    cached_data = redisClient.get(f"raw_data:{upload_id}:{measurement_id}")

    if not cached_data:
        cached_data = cache_fallback_service(upload_id)

    raw_data = json.loads(cached_data)
    abstimes = np.array(raw_data["channel1"]["abstimes"], dtype=np.float64)

    times_ms, counts = bin_photons(abstimes=abstimes, bin_size_ms=payload.bin_size_ms)
    intensity_cps = compute_intensity_cps(counts=counts, bin_size_ms=payload.bin_size_ms)

    res_data = {
        "time_bins": times_ms.tolist(),
        "counts": counts.tolist(),
        "intensity_cps": intensity_cps.tolist()
    }

    response: IntensityRes = IntensityRes(**res_data)
    return response