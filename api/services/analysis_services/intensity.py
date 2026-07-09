from api.utils.redis_Client import redisClient
from api.models.analysis_models import Intensity_Req, Intensity_Res
import json
import numpy as np 
from api.legacy.analysis.histograms import bin_photons, compute_intensity_cps

import json

async def intensity_analysis(payload: Intensity_Req) -> Intensity_Res:
    """
    Intensity analysis Service.

    Returns:
        response (Intensity_Res): Object containing time_bins, counts and intesity_cps
    """
    upload_id= payload.uplod_id
    measurement_id = payload.upload_id

    cached_data = redisClient.get(f"raw_data:{upload_id}:{measurement_id}")
    if not cached_data:
        raise ValueError("Raw data not in cache.")

    raw_data = json.load(cached_data)
    abstimes = np.array(raw_data["channel"]["abstimes"], dtype=np.float64)

    times_ms, counts = bin_photons(abstimes=abstimes, bin_size_ms=payload.bin_size_ms)
    intensity_cps = compute_intensity_cps(counts=counts, bin_size_ms=payload.bin_size_ms)

    response: Intensity_Res = {
        "time_bins": times_ms.tolist(),
        "counts": counts.tolist(),
        "intensity_cps": intensity_cps.tolist()
    }

    return response