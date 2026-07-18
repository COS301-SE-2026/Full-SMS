from api.legacy.analysis.lifetime import fit_decay
from api.legacy.analysis.histograms import build_decay_histogram
from api.models.analysis_models import LifetimeReq, LifetimeRes
from api.services.analysis_services.cache_fallback import cache_fallback_service
from api.utils.redis_Client import redisClient
import json
import numpy as np


def lifetime_fitting(payload: LifetimeReq):
    upload_id = payload.upload_id
    measurement_id = payload.measurement_id
    

    cached_data = redisClient.get(f"raw_data:{upload_id}:{measurement_id}")

    if not cached_data:
        cached_data = cache_fallback_service(upload_id)

    raw_data = json.loads(cached_data)
    channel_width = raw_data["channelWidth"]
    
    fit_result = fit_decay(
        counts=np.array(payload.counts, dtype=np.float64),
        t=np.array(payload.times, dtype=np.float64),
        channelwidth=channel_width,
        )

    res_data = {
        "times": payload.times,
        "counts": payload.counts,
        "tau": list(fit_result.tau),
        "tau_std": list(fit_result.tau_std),
        "amplitude": list(fit_result.amplitude),
        "amplitude_std": list(fit_result.amplitude_std),
        "shift": float(fit_result.shift),
        "shift_std": float(fit_result.shift_std),
        "chi_squared": float(fit_result.chi_squared),
        "durbin_watson": float(fit_result.durbin_watson),
        "dw_bounds": list(fit_result.dw_bounds) if fit_result.dw_bounds else None,
        
        # THE MAGIC: .tolist() converts NumPy NDArrays to standard Python lists
        "residuals": fit_result.residuals.tolist(),
        "fitted_curve": fit_result.fitted_curve.tolist(),
        
        "fit_start_index": int(fit_result.fit_start_index),
        "fit_end_index": int(fit_result.fit_end_index),
        "background": float(fit_result.background),
        "num_exponentials": int(fit_result.num_exponentials),
        "average_lifetime": float(fit_result.average_lifetime),
        "fitted_irf_fwhm": float(fit_result.fitted_irf_fwhm) if fit_result.fitted_irf_fwhm else None,
        "fitted_irf_fwhm_std": float(fit_result.fitted_irf_fwhm_std) if fit_result.fitted_irf_fwhm_std else None,
    }

    # 3. Return the fully serialized Pydantic model
    return LifetimeRes(**res_data)

def fluorescence_decay(payload):
    upload_id = payload.upload_id
    measurement_id = payload.measurement_id
    

    cached_data = redisClient.get(f"raw_data:{upload_id}:{measurement_id}")

    if not cached_data:
        cached_data = cache_fallback_service(upload_id)

    raw_data = json.loads(cached_data)
    microtimes = raw_data["channel1"]["microtimes"]
    channel_width = raw_data["channelWidth"]
    times, counts = build_decay_histogram(
        microtimes=microtimes,
        channelwidth=channel_width
    )

    return{ 
        "times": times.tolist(),
        "counts": counts.tolist()
    }


# def lifetime_analysis(payload):
#     upload_id = payload.upload_id
#     measurement_id = payload.measurement_id
    
#     cached_data = redisClient.get(f"raw_data:{upload_id}:{measurement_id}")

#     if not cached_data:
#         cached_data = cache_fallback_service(upload_id)

#     raw_data = json.loads(cached_data)
    
#     # 1. Extract all required variables from your raw_data dictionary
#     microtimes = raw_data["channel1"]["microtimes"]
#     abstimes = raw_data["channel1"]["abstimes"] # <-- Must define this!
#     channel_width = raw_data["channelWidth"]
    
#     # 2. Use the extracted abstimes and the payload's bin_size_ms
#     times_ms, counts = bin_photons(
#         abstimes=abstimes, 
#         bin_size_ms=payload.bin_size_ms
#     )
    
#     result = fit_decay(
#         counts=counts,
#         t=microtimes,
#         channelwidth=channel_width,
#     )

#     return result

